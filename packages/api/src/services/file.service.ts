import { randomUUID } from 'node:crypto';
import type { MultipartFile } from '@fastify/multipart';
import { ALLOWED_IMAGE_MIME } from '@mobilny-obhodchik/shared';
import type { IStorageAdapter } from '../adapters/storage/storage-adapter.interface.js';
import type { FileRepository } from '../repositories/file.repository.js';
import { Errors } from '../errors.js';

export class FileService {
  constructor(
    private readonly files: FileRepository,
    private readonly storage: IStorageAdapter,
  ) {}

  async upload(userId: string, file: MultipartFile) {
    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
      throw Errors.Validation('Поддерживаются только изображения JPG, PNG и WEBP');
    }

    const buffer = await file.toBuffer();
    if (!buffer.length) {
      throw Errors.Validation('Файл пустой');
    }

    const id = randomUUID();
    const stored = await this.storage.save({
      id,
      filename: file.filename,
      mimeType: file.mimetype,
      data: buffer,
    });

    await this.files.create({
      id,
      filename: `${id}_${file.filename.replace(/[^\w.\-]/g, '_')}`,
      originalName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: buffer.length,
      storagePath: stored.storagePath,
      uploadedById: userId,
    });

    return {
      id,
      filename: file.filename,
      mimeType: file.mimetype,
      sizeBytes: buffer.length,
      url: stored.url,
    };
  }
}

