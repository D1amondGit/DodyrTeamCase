export interface StoredFile {
  storagePath: string;
  url: string;
}

export interface IStorageAdapter {
  save(params: {
    id: string;
    filename: string;
    mimeType: string;
    data: Buffer;
  }): Promise<StoredFile>;
  read(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
  urlFor(storagePath: string): string;
}
