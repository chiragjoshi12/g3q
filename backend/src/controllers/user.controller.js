import { UserModel } from '../models/UserModel.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) throw new AppError(ERROR_CODE.NOT_FOUND);
  return res.status(200).json(user);
});
