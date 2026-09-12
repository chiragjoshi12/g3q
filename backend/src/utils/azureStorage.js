import dns from 'node:dns/promises';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { CONFIG } from '../config/index.js';

/** Fail Azure calls before the client aborts with a generic network error. */
const AZURE_OP_TIMEOUT_MS = 8_000;

function trimSlashes(value) {
  return String(value ?? '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

function storageOrigin() {
  const publicBase = String(CONFIG.STORAGE.PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  if (publicBase) return publicBase;

  const accountName = String(CONFIG.STORAGE.ACCOUNT_NAME || '').trim();
  if (!accountName) return '';
  return `https://${accountName}.blob.core.windows.net`;
}

export function resolveAzureBlobUrl(blobPath, { container = CONFIG.STORAGE.CONTAINER } = {}) {
  const normalizedPath = String(blobPath ?? '').trim();
  if (!normalizedPath) return null;
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;

  const origin = storageOrigin();
  const containerName = trimSlashes(container);
  if (!origin || !containerName) return normalizedPath;

  return `${origin}/${containerName}/${trimSlashes(normalizedPath)}`;
}

function getBlobServiceClient() {
  const accountName = String(CONFIG.STORAGE.ACCOUNT_NAME || '').trim();
  const accountKey = String(CONFIG.STORAGE.ACCOUNT_KEY || '').trim();
  if (!accountName || !accountKey) {
    throw new Error(
      'Azure storage is not configured. Set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY.'
    );
  }
  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  return new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential);
}

async function assertStorageHostResolves(accountName) {
  const host = `${accountName}.blob.core.windows.net`;
  try {
    await dns.lookup(host);
  } catch {
    throw new Error(
      `Profile photo storage host could not be resolved (${host}). Check AZURE_STORAGE_ACCOUNT_NAME and DNS/network.`
    );
  }
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out after ${Math.round(ms / 1000)}s. Check Azure storage network access / account name.`
        )
      );
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Upload a buffer to Azure Blob Storage.
 * Default container: `g3q`. Profile photos use folder prefix `Profile/`.
 * Returns the blob path (not a full URL) for DB storage.
 */
export async function uploadAzureBlob({
  blobPath,
  buffer,
  contentType = 'application/octet-stream',
  container = CONFIG.STORAGE.CONTAINER,
}) {
  const accountName = String(CONFIG.STORAGE.ACCOUNT_NAME || '').trim();
  const containerName = trimSlashes(container || 'g3q') || 'g3q';
  const path = trimSlashes(blobPath);
  if (!path) throw new Error('blobPath is required');
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('buffer is required');

  await assertStorageHostResolves(accountName);

  const abortSignal =
    typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(AZURE_OP_TIMEOUT_MS)
      : undefined;

  try {
    const service = getBlobServiceClient();
    const containerClient = service.getContainerClient(containerName);

    // Prefer upload into an existing container — createIfNotExists often hangs
    // when DNS/network to Azure is blocked and is unnecessary in prod.
    const blockBlob = containerClient.getBlockBlobClient(path);
    await withTimeout(
      blockBlob.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: contentType,
          // Paths are unique per upload (timestamp), so browsers can keep forever.
          blobCacheControl: 'public, max-age=31536000, immutable',
        },
        abortSignal,
      }),
      AZURE_OP_TIMEOUT_MS,
      'Azure blob upload'
    );

    return {
      blobPath: path,
      url: resolveAzureBlobUrl(path, { container: containerName }),
      container: containerName,
    };
  } catch (error) {
    const message = String(error?.message || error || '');
    if (/ENOTFOUND|getaddrinfo|Could not resolve|could not be resolved|timed out|aborted|AbortError/i.test(message)) {
      throw new Error(
        'Profile photo storage is unreachable (Azure Blob). Check AZURE_STORAGE_ACCOUNT_NAME and network access.'
      );
    }
    throw error instanceof Error ? error : new Error(message || 'Azure upload failed');
  }
}
