# Audio Recorder

A browser-based audio recorder built with React and the Web Audio API. Supports long recordings (limitation set to 4 hours, but customizable), persisting reconrdings chunks in IndexedDB. Because chunks are written to IndexedDB as they arrive, recordings data are not lost between page refreshes, tab crashes and other unexpected errors.


[Live Demo](https://kongolml.github.io/voice2mp3/)

## Features

- **Record** — Start/stop recording with microphone access
- **Pause & resume** — Pause and continue without losing the session
- **Live visualizer** — Real-time waveform while recording
- **Preview** — Play back the recording in-browser
- **Download** — Directly download as mp3

## Tech stack

- **React 19** + **TypeScript** + **Vite**
- **Zustand** — Recording state (idle, recording, paused, stopped)
- **Tailwind CSS** + **Radix UI** (shadcn) — UI and components
- **Web Audio API** — `AudioWorkletNode` for PCM capture, `AnalyserNode` for visualization
- **Web Worker** + **lamejs** — Streaming MP3 encoding off the main thread
- **IndexedDB** — Durable storage for MP3 chunks during recording

## Getting started

### Prerequisites

- Node.js (project uses `"type": "module"`)
- A modern browser with microphone support (HTTPS or localhost)

### Install and run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. `http://localhost:5173`). Allow microphone access when prompted.

### Scripts

| Command     | Description              |
|------------|--------------------------|
| `npm run dev`     | Start dev server (Vite)  |
| `npm run build`   | Type-check and build     |
| `npm run preview` | Serve production build   |
| `npm run lint`    | Run ESLint               |

## How it works

### Recording pipeline

```
Microphone → AudioContext → AudioWorkletNode (PCM capture) → MP3 Encoder Worker (lamejs) → Main Thread → IndexedDB (chunks) → finalizeSession() → MP3 Blob → Download
```

1. **Mic capture** — `getUserMedia` gets the microphone stream. An `AudioContext` connects it to both an `AnalyserNode` (for visualization) and an `AudioWorkletNode` (for PCM capture).

2. **PCM capture (AudioWorklet)** — The `raw-audio-processor` worklet runs on the audio rendering thread. Its `process()` method receives raw Float32 PCM samples and posts them to the main thread via `postMessage`.

3. **MP3 encoding (Web Worker)** — The main thread relays each PCM chunk to the `lame-js.worker`. The worker converts Float32 to Int16 and feeds it to a lamejs `Mp3Encoder` instance. Whenever the encoder produces output, the worker posts the MP3 bytes back.

4. **Persistence (IndexedDB)** — Each MP3 chunk returned by the worker is immediately written to IndexedDB (`chunks` store), keyed by session ID and a monotonically increasing index. Audio is stored during recording, not held in memory.

5. **Finalization** — When the user stops recording, the worklet is disconnected, the worker flushes, and `finalizeSession()` reads all chunks from IndexedDB, concatenates them into a single MP3 `Blob`, and marks the session as finalized. The blob can be previewed or downloaded directly — no re-encoding needed.