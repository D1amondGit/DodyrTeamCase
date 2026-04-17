import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { IStorageAdapter, StoredFile } from './storage-adapter.interface.js';

export class LocalStorageAdapter implements IStorageAdapter {
  constructor(private readonly rootDir: string) {}

  async ensureRoot(): Promise<void> {
    await fs.mkdir(this.rootDir, { recursive: true });
  }

  async save(params: {
    id: string;
    filename: string;
    mimeType: string;
    data: Buffer;
  }): Promise<StoredFile> {
    await this.ensureRoot();
    const safeName = params.filename.replace(/[^\w.\-]/g, '_');
    const storagePath = `${params.id}_${safeName}`;
    const absPath = path.join(this.rootDir, storagePath);
    await fs.writeFile(absPath, params.data);
    return { storagePath, url: this.urlFor(storagePath) };
  }

  async read(storagePath: string): Promise<Buffer> {
    const absPath = path.join(this.rootDir, storagePath);
    return fs.readFile(absPath);
  }

  async delete(storagePath: string): Promise<void> {
    const absPath = path.join(this.rootDir, storagePath);
    await fs.unlink(absPath).catch(() => undefined);
  }

  urlFor(storagePath: string): string {
    return `/api/v1/files/${encodeURIComponent(storagePath)}`;
  }
}
