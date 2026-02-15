# Audio Recorder

A browser-based audio recorder built with React and the Web Audio API.

## Features

- **Record** — Start/stop recording with microphone access
- **Pause & resume** — Pause and continue without losing the session
- **Live visualizer** — Real-time waveform while recording
- **Preview** — Play back the recording before exporting
- **Export** — Download as WebM (native) or encode to MP3 in a background worker

## Tech stack

- **React 19** + **TypeScript** + **Vite**
- **Zustand** — Recording state (idle, recording, paused, stopped)
- **Tailwind CSS** + **Radix UI** (shadcn) — UI and components
- **MediaRecorder API** — Capture audio in chunks (e.g. 5s)
- **Web Audio API** — Analyser for visualization, decode for MP3 export
- **Web Worker** + **lamejs** — MP3 encoding off the main thread

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

1. **Recording** — `getUserMedia` gets the mic stream; `MediaRecorder` records in time-sliced chunks. Chunks are merged into a single WebM `Blob` when recording stops.
2. **Visualization** — An `AudioContext` + `AnalyserNode` from the same stream drive the waveform; drawing is done in a custom hook/canvas.
3. **MP3 export** — The WebM blob is decoded to PCM in the main thread, then raw samples and sample rate are sent to a Web Worker. The worker uses lamejs to produce an MP3 blob; progress can be reported back for a progress bar.