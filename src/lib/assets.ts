export const LOCAL_ASSET_PREFIX = 'platport-asset://';

interface StoredAsset {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: number;
  blob: Blob;
}

export interface LocalAssetRef {
  id: string;
  name: string;
  url: string;
}

const DB_NAME = 'platport-assets';
const DB_VERSION = 1;
const STORE_NAME = 'assets';
const memoryAssets = new Map<string, StoredAsset>();

function createAssetId() {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `asset-${Date.now()}-${random}`;
}

function getIndexedDb() {
  return typeof indexedDB === 'undefined' ? null : indexedDB;
}

function openAssetDb(): Promise<IDBDatabase | null> {
  const dbFactory = getIndexedDb();
  if (!dbFactory) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request = dbFactory.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open asset store'));
  });
}

async function withAssetStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  const db = await openAssetDb();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = callback(transaction.objectStore(STORE_NAME));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Asset store request failed'));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error('Asset store transaction failed'));
    };
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read asset'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read asset'));
    reader.readAsDataURL(blob);
  });
}

export async function saveLocalAsset(file: File): Promise<LocalAssetRef> {
  const id = createAssetId();
  const asset: StoredAsset = {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
    createdAt: Date.now(),
    blob: file,
  };

  const stored = await withAssetStore('readwrite', (store) => store.put(asset));
  if (stored === null) {
    memoryAssets.set(id, asset);
  }

  return {
    id,
    name: file.name,
    url: `${LOCAL_ASSET_PREFIX}${id}`,
  };
}

export async function getLocalAssetDataUrl(id: string): Promise<string | null> {
  const memoryAsset = memoryAssets.get(id);
  if (memoryAsset) return blobToDataUrl(memoryAsset.blob);

  const asset = await withAssetStore<StoredAsset>('readonly', (store) => store.get(id));
  return asset?.blob ? blobToDataUrl(asset.blob) : null;
}

export async function resolveLocalAssetUrls(markdown: string): Promise<string> {
  const matches = Array.from(markdown.matchAll(/platport-asset:\/\/([A-Za-z0-9-]+)/g));
  if (matches.length === 0) return markdown;

  const replacements = await Promise.all(
    matches.map(async (match) => ({
      source: match[0],
      dataUrl: await getLocalAssetDataUrl(match[1]),
    })),
  );

  return replacements.reduce(
    (nextMarkdown, item) =>
      item.dataUrl ? nextMarkdown.split(item.source).join(item.dataUrl) : nextMarkdown,
    markdown,
  );
}
