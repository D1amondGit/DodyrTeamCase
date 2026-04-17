import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface FileRecord {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedById: string;
  createdAt: string;
}

/**
 * Filesystem-backed file registry.
 * Phase 2: swap with S3 + DB-backed implementation via IStorageAdapter.
 */
export class FileRepository {
  private readonly registryPath: string;
  private records: Map<string, FileRecord> = new Map();
  private loaded = false;

  constructor(private readonly storageDir: string) {
    this.registryPath = path.join(storageDir, '_registry.json');
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    await fs.mkdir(this.storageDir, { recursive: true });
    try {
      const raw = await fs.readFile(this.registryPath, 'utf-8');
      const arr: FileRecord[] = JSON.parse(raw);
      this.records = new Map(arr.map((r) => [r.id, r]));
    } catch {
      this.records = new Map();
    }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    await fs.writeFile(
      this.registryPath,
      JSON.stringify(Array.from(this.records.values()), null, 2),
    );
  }

  async create(record: Omit<FileRecord, 'createdAt'>): Promise<FileRecord> {
    await this.ensureLoaded();
    const fullRecord: FileRecord = { ...record, createdAt: new Date().toISOString() };
    this.records.set(fullRecord.id, fullRecord);
    await this.persist();
    return fullRecord;
  }

  async save(file: {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    data: Buffer;
    uploadedById: string;
  }): Promise<FileRecord> {
    await this.ensureLoaded();
    const id = crypto.randomUUID();
    const ext = path.extname(file.originalName).toLowerCase() || '.bin';
    const filename = `${id}${ext}`;
    const storagePath = path.join(this.storageDir, filename);
    await fs.writeFile(storagePath, file.data);

    const record: FileRecord = {
      id,
      filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      storagePath,
      uploadedById: file.uploadedById,
      createdAt: new Date().toISOString(),
    };
    this.records.set(id, record);
    await this.persist();
    return record;
  }

  async findById(id: string): Promise<FileRecord | null> {
    await this.ensureLoaded();
    return this.records.get(id) ?? null;
  }

  async readBuffer(id: string): Promise<Buffer | null> {
    const record = await this.findById(id);
    if (!record) return null;
    try {
      return await fs.readFile(record.storagePath);
    } catch {
      return null;
    }
  }
}
