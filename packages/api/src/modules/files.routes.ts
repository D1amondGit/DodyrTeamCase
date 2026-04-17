import type { FastifyInstance } from 'fastify';
import { LocalStorageAdapter } from '../adapters/storage/local-storage.adapter.js';
import { config } from '../config.js';
import { repositories } from '../repositories/index.js';
import { FileService } from '../services/file.service.js';
import { Errors } from '../errors.js';

export async function fileRoutes(app: FastifyInstance) {
  const storage = new LocalStorageAdapter(config.STORAGE_LOCAL_PATH);
  const fileService = new FileService(repositories.files, storage);

  app.addHook('preValidation', app.authenticate);

  app.post('/upload', async (request) => {
    const file = await request.file();
    if (!file) {
      throw Errors.BadRequest('Не найден файл в multipart payload');
    }

    const data = await fileService.upload(request.user.sub, file);
    return { success: true, data };
  });
}

