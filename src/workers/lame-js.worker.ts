import { Mp3Encoder } from "@breezystack/lamejs";

// types
import type { Mp3WorkerInputMessage, Mp3WorkerOutputMessage } from "@/meta/workers.meta";


let encoder: Mp3Encoder | null = null;

/**
 * Converts Float32 [-1.0, 1.0] to Int16 [-32768, 32767]/[0x8000, 0x7fff].
 * This is how lamejs expects audio data
 */
const float32ToInt16 = (float32: Float32Array): Int16Array => {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16;
}

/**
 * Encodes raw audio data into mp3.
 * Lamejs worker is initialized here as well and used the same instance for the entire recording session.
 */
self.onmessage = (e: MessageEvent<Mp3WorkerInputMessage>) => {
    try {
        const { type } = e.data;

        if (type === 'init') {
            const { sampleRate } = e.data;
            encoder = new Mp3Encoder(1, sampleRate, 128);
            return;
        }

        if (type === 'encode') {
            if (!encoder) {
                self.postMessage({ type: 'error', error: 'Encoder not initialized' } satisfies Mp3WorkerOutputMessage);
                return;
            }

            const int16 = float32ToInt16(e.data.rawAudio);
            const mp3buf = encoder.encodeBuffer(int16);

            if (mp3buf.length > 0) {
                self.postMessage({ type: 'encoded', mp3Chunk: new Uint8Array(mp3buf) } satisfies Mp3WorkerOutputMessage);
            }
            return;
        }

        if (type === 'recording-finished') {
            if (!encoder) {
                self.postMessage({ type: 'error', error: 'Encoder not initialized' } satisfies Mp3WorkerOutputMessage);
                return;
            }

            // encode last bits and clear memory from encoder
            const remaining = encoder.flush();
            if (remaining.length > 0) {
                self.postMessage({ type: 'encoded', mp3Chunk: new Uint8Array(remaining) } satisfies Mp3WorkerOutputMessage);
            }

            encoder = null;
            self.postMessage({ type: 'done' } satisfies Mp3WorkerOutputMessage);
            return;
        }
    } catch (err) {
        self.postMessage({
            type: 'error',
            error: err instanceof Error ? err.message : 'mp3 encoding failed',
        });
    }
};
