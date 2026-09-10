import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { CONFIG } from '../config/index.js';

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
    throw new Error('Azure storage is not configured. Set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY.');
  }
  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  return new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential);
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
  const containerName = trimSlashes(container || 'g3q') || 'g3q';
  const path = trimSlashes(blobPath);
  if (!path) throw new Error('blobPath is required');
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('buffer is required');

  const service = getBlobServiceClient();
  const containerClient = service.getContainerClient(containerName);
  await containerClient.createIfNotExists({ access: 'blob' });

  const blockBlob = containerClient.getBlockBlobClient(path);
  await blockBlob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return {
    blobPath: path,
    url: resolveAzureBlobUrl(path, { container: containerName }),
    container: containerName,
  };
}
