import { CONFIG } from '../config/index.js';

function trimSlashes(value) {
  return String(value ?? '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

export function resolveAzureBlobUrl(blobPath, { container = CONFIG.STORAGE.CONTAINER } = {}) {
  const normalizedPath = String(blobPath ?? '').trim();
  if (!normalizedPath) return null;
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;

  const accountName = String(CONFIG.STORAGE.ACCOUNT_NAME || '').trim();
  const containerName = trimSlashes(container);
  if (!accountName || !containerName) return normalizedPath;

  return `https://${accountName}.blob.core.windows.net/${containerName}/${trimSlashes(normalizedPath)}`;
}
