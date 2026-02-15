import { Mp3Encoder } from "@breezystack/lamejs";

interface LameJsWorkerMessage {
    type: 'export-mp3';
    samples: ArrayBuffer;
    sampleRate: number;
}

/**
 * Converts an audio Blob into a mono Int16Array of PCM samples.
 *  Decodes the blob at 44100 Hz using OfflineAudioContext,
 *  then converts Float32 [-1.0, 1.0] to Int16 [-32768, 32767]
 *  suitable for MP3 encoding (e.g. lamejs)
 */
self.onmessage = (event: MessageEvent<LameJsWorkerMessage>) => {
    console.log('lame-js.worker.ts: onmessage', event);
    if (event.data.type !== 'export-mp3') return;

    const float32 = new Float32Array(event.data.samples);
    const int16 = new Int16Array(float32.length);

    for (let i = 0; i < float32.length; i++) {
        const singleSample = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = singleSample < 0 ? singleSample * 0x8000 : singleSample * 0x7fff;
    }

    const mp3Encoder = new Mp3Encoder(1, event.data.sampleRate, 128);
    const mp3Data: Int8Array[] = [];
    const chunkSize = 1152; // Process in chunks of 1152 samples
    const totalChunks = Math.ceil(int16.length / chunkSize);

    for (let i = 0; i < int16.length; i += chunkSize) {
        const chunk = int16.subarray(i, i + chunkSize);
        const buf = mp3Encoder.encodeBuffer(chunk);
        if (buf.length > 0) mp3Data.push(new Int8Array(buf));

        self.postMessage({ type: 'progress', progress: (i / chunkSize + 1) / totalChunks });
    }

    const flush = mp3Encoder.flush(); // finish writing mp3
    if (flush.length > 0) mp3Data.push(new Int8Array(flush));

    const mp3Blob = new Blob(mp3Data.map(d => new Int8Array(d)), { type: 'audio/mp3' });

    self.postMessage({ type: 'success', mp3Blob });
};