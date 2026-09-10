import { z } from 'zod';

export const uploadProfilePhotoSchema = z.object({
  imageBase64: z.string().min(1),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});
