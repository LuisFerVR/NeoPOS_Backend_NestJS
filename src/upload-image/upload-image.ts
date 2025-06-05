import { v2 as cloudinary } from 'cloudinary';

export const UploadImageProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLODINARY_API_SECRET,
    });
    return cloudinary;
  },
};
