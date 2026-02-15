const DB_NAME = 'audio-recorder-db';
const DB_VERSION = 1;
const SESSIONS_STORE = 'recording-sessions';
const CHUNKS_STORE = 'mp3-chunks';

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            // when db version is changed or initial db setup
            const db = request.result;

            if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
                db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
                const store = db.createObjectStore(CHUNKS_STORE, { autoIncrement: true });
                store.createIndex('sessionId', 'sessionId', { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function createSession(): Promise<string> {
    const db = await openDb();
    const id = crypto.randomUUID();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        tx.objectStore(SESSIONS_STORE).add({
            id,
            createdAt: Date.now(),
            finalized: false,
        });
        tx.oncomplete = () => {
            db.close();
            resolve(id);
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
}

let chunkIndex = 0;
export async function appendChunk(sessionId: string, data: Uint8Array): Promise<void> {
    const db = await openDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(CHUNKS_STORE, 'readwrite');
        tx.objectStore(CHUNKS_STORE).add({
            sessionId,
            index: chunkIndex++,
            data,
        });
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
}

async function getAllChunks(sessionId: string): Promise<Uint8Array[]> {
    const db = await openDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(CHUNKS_STORE, 'readonly');
        const index = tx.objectStore(CHUNKS_STORE).index('sessionId');
        const request = index.getAll(sessionId);

        request.onsuccess = () => {
            db.close();
            const results = request.result as Array<{ index: number; data: Uint8Array }>;
            results.sort((a, b) => a.index - b.index);
            resolve(results.map((r) => r.data));
        };
        request.onerror = () => {
            db.close();
            reject(request.error);
        };
    });
}

export async function finalizeSession(sessionId: string): Promise<Blob> {
    const chunks = await getAllChunks(sessionId);
    const blob = new Blob(chunks.map((chunk) => new Uint8Array(chunk)), { type: 'audio/mp3' });

    const db = await openDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        const getReq = store.get(sessionId);

        getReq.onsuccess = () => {
            const session = getReq.result;
            if (session) {
                session.finalized = true;
                store.put(session);
            }
        };

        tx.oncomplete = () => {
            db.close();
            resolve(blob);
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
}