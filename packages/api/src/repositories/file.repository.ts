import type { PrismaClient } from '@prisma/client';

export class FileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storagePath: string;
    uploadedById: string;
  }) {
    return this.prisma.file.create({ data });
  }
}

