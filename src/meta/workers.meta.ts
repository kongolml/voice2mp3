export type Mp3WorkerInputMessage =
  | { type: 'init'; sampleRate: number }
  | { type: 'encode'; rawAudio: Float32Array }
  | { type: 'recording-finished' };

export type Mp3WorkerOutputMessage =
  | { type: 'encoded'; mp3Chunk: Uint8Array }
  | { type: 'error'; error: string }
  | { type: 'done' };

export type Mp3WorkerAllMessages = Mp3WorkerInputMessage | Mp3WorkerOutputMessage;

export type RawAudioWorkerOutputMessage = {
  type: 'raw-audio';
  rawAudio: Float32Array;
};