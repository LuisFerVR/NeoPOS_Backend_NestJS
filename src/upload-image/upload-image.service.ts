import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './upload-image-response';
import streamifier from 'streamifier';
import { Writable } from 'stream';

@Injectable()
export class UploadImageService {
  uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        (error, result) => {
          if (error instanceof Error) return reject(error);
          if (error) return reject(new Error(JSON.stringify(error)));
          if (!result)
            return reject(new Error('No se recibió respuesta de Cloudinary.'));
          resolve(result as CloudinaryResponse);
        },
      ) as Writable;

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
