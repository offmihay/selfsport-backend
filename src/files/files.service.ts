import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { TournamentDto } from 'src/tournaments/dto/tournaments.dto';
import { Readable } from 'stream';

@Injectable()
export class FilesService {
  constructor() {
    cloudinary.config({
      secure: true,
    });
  }

  upload(file: Express.Multer.File) {
    return new Promise<UploadApiResponse | undefined>((resolve, reject) => {
      const transformStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          filename_override: file.originalname,
          use_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );
      const stream = Readable.from(file.buffer);
      stream.pipe(transformStream);
    });
  }

  getResourcesByPublicIds(publicIds: string[]) {
    return cloudinary.api.resources_by_ids(publicIds);
  }

  async transformImages(dtoImages: TournamentDto['images']) {
    const publicIds = dtoImages?.map((image) => image.publicId);

    const resources = publicIds?.length
      ? (await this.getResourcesByPublicIds(publicIds)).resources
      : [];

    const images = resources.map((r) => ({
      createdAt: r.created_at,
      publicId: r.public_id,
      url: r.url,
      secureUrl: r.secure_url,
    }));

    return images;
  }
}
