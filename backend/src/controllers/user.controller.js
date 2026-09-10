import { UserModel } from '../models/UserModel.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';
import { uploadAzureBlob } from '../utils/azureStorage.js';

const MAX_PROFILE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function extensionForMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export const getMe = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) throw new AppError(ERROR_CODE.NOT_FOUND);
  return res.status(200).json(user);
});

export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const { imageBase64, contentType } = req.body || {};
  const mime = String(contentType || '').trim().toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    throw new AppError(
      ERROR_CODE.INVALID_REQUEST,
      'Profile photo must be a JPEG, PNG, or WebP image.'
    );
  }

  const raw = String(imageBase64 || '').replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
  if (!raw) {
    throw new AppError(ERROR_CODE.INVALID_REQUEST, 'imageBase64 is required.');
  }

  let buffer;
  try {
    buffer = Buffer.from(raw, 'base64');
  } catch {
    throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Invalid imageBase64 payload.');
  }

  if (!buffer.length || buffer.length > MAX_PROFILE_BYTES) {
    throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Could not process profile photo.');
  }

  const ext = extensionForMime(mime);
  const blobPath = `Profile/${req.user.id}/${Date.now()}.${ext}`;

  let uploaded;
  try {
    uploaded = await uploadAzureBlob({
      blobPath,
      buffer,
      contentType: mime,
      container: 'g3q',
    });
  } catch (error) {
    throw new AppError(
      ERROR_CODE.UNKNOWN,
      error?.message || 'Failed to upload profile photo to Azure.'
    );
  }

  const user = await UserModel.updateProfilePhoto(req.user.id, uploaded.blobPath);
  return res.status(200).json(user);
});
