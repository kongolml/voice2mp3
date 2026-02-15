import { useCallback, useRef } from "react";

// store
import { useAudioRecorderStore } from "@/store/useAudioRecorder.store";

// meta
import { RecorderStatesEnum } from "@/meta/recorder.meta";
import type {
	Mp3WorkerInputMessage,
	RawAudioWorkerOutputMessage,
	Mp3WorkerAllMessages,
} from "@/meta/workers.meta";

// utils
import {
	appendChunk,
	createSession,
	finalizeSession,
} from "@/utils/indexed-db";

const RAW_AUDIO_PROCESSOR_URL = new URL(
	"../workers/raw-audio-processor.worklet.ts",
	import.meta.url,
);


export const useAudioRecorder = () => {
	const audioRecorderStore = useAudioRecorderStore();
	const audioRecorderState = audioRecorderStore.recorderState;

	const audioCtxRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const sessionIdRef = useRef<string | null>(null);
	const mp3WorkerRef = useRef<Worker | null>(null);
	const workletNodeRef = useRef<AudioWorkletNode | null>(null);

	/**
	 * Stop the stream, closes audio context and resets all refs to null.
	 * This removes all UI elements and prevents memory leaks.
	 */
	const cleanup = () => {
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
		audioCtxRef.current?.close();
		audioCtxRef.current = null;
		analyserRef.current = null;
		// mediaRecorderRef.current = null;
	};

	/**
	 * Request access to microphone, then starts recording by splitting audio
	 * into chunks (as discussed previously) of AUDIO_CHUNKS_LENGTH_MS seconds.
	 * Then we glue chunks together to form a single audio file in the end.
	 */
	const startRecording = async () => {
		try {
			if (audioRecorderState !== RecorderStatesEnum.IDLE) return;

			audioRecorderStore.reset();

			const audioStream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});

			const audioCtx = new AudioContext();

			// connect analyser to the stream
			const streamAudioSource = audioCtx.createMediaStreamSource(audioStream);
			const analyser = audioCtx.createAnalyser();
			analyser.fftSize = 256;
			streamAudioSource.connect(analyser);

			// connect processing worklet node to the stream
			await audioCtx.audioWorklet.addModule(RAW_AUDIO_PROCESSOR_URL);
			const workletNode = new AudioWorkletNode(audioCtx, "raw-audio-processor");
			streamAudioSource.connect(workletNode);

			// set IndexedDB session
			const sessionId = await createSession();
			sessionIdRef.current = sessionId;

			const mp3Worker = new Worker(
				new URL("../workers/lame-js.worker.ts", import.meta.url),
				{ type: "module" },
			);

			streamRef.current = audioStream;
			audioCtxRef.current = audioCtx;
			analyserRef.current = analyser;
			workletNodeRef.current = workletNode;
			mp3WorkerRef.current = mp3Worker;

			audioRecorderStore.setAudioAnalyser(analyser);

			mp3Worker.postMessage({
				type: "init",
				sampleRate: audioCtx.sampleRate,
			} satisfies Mp3WorkerInputMessage);

			// received raw audio data from the worklet node
			workletNode.port.onmessage = (
				e: MessageEvent<RawAudioWorkerOutputMessage>,
			) => {
				mp3Worker.postMessage({
					type: "encode",
					rawAudio: e.data.rawAudio,
				} satisfies Mp3WorkerInputMessage);
			};

			mp3Worker.onmessage = (e: MessageEvent<Mp3WorkerAllMessages>) => {
				const msg = e.data;
				if (msg.type === "encoded") {
					appendChunk(sessionId, msg.mp3Chunk);
					//   setEncodedChunks((c) => c + 1);
				} else if (msg.type === "error") {
					//   setError(msg.error);
				}
			};

			audioRecorderStore.startRecording();
		} catch (error) {
			console.error(
				"Error starting recording, probably you have denied access to microphone",
				error
			);
			cleanup();
			return;
		}
	};
	// const stopRecording = () => {
	// 	if (
	// 		audioRecorderState !== RecorderStatesEnum.RECORDING &&
	// 		audioRecorderState !== RecorderStatesEnum.PAUSED
	// 	) {
	// 		return;
	// 	}

	// 	mediaRecorderRef.current?.stop();
	// 	audioRecorderStore.stopRecording();
	// };

	const stopRecording = useCallback(async () => {
		if (
			audioRecorderState !== RecorderStatesEnum.RECORDING &&
			audioRecorderState !== RecorderStatesEnum.PAUSED
		) {
			return;
		}
		if (!mp3WorkerRef.current || !sessionIdRef.current) return;

		const mp3Worker = mp3WorkerRef.current;
		const sessionId = sessionIdRef.current;

		// Disconnect worklet to stop PCM flow
		workletNodeRef.current?.disconnect();

		// Send finish and wait untill last chuks are procecssed
		await new Promise<void>((resolve, reject) => {
			mp3Worker.onmessage = (e: MessageEvent<Mp3WorkerAllMessages>) => {
				const msg = e.data;
				if (msg.type === "encoded") {
					appendChunk(sessionId, msg.mp3Chunk);
					//   setEncodedChunks((c) => c + 1);
				} else if (msg.type === "done") {
					resolve();
				} else if (msg.type === "error") {
					reject(new Error(msg.error));
				}
			};
			mp3Worker.postMessage({
				type: "recording-finished",
			} satisfies Mp3WorkerInputMessage);
		});

		// Finalize: read all chunks from IndexedDB → single MP3 Blob
		const blob = await finalizeSession(sessionId);
		audioRecorderStore.setAudioBlob(blob);

		cleanup();
		// mediaRecorderRef.current?.stop();
		audioRecorderStore.stopRecording();
	}, [cleanup, audioRecorderStore]);
	const pauseRecording = () => {
		if (audioRecorderState !== RecorderStatesEnum.RECORDING) return;
		// mediaRecorderRef.current?.pause();
		audioRecorderStore.pauseRecording();
	};
	const resumeRecording = () => {
		if (audioRecorderState !== RecorderStatesEnum.PAUSED) return;
		// mediaRecorderRef.current?.resume();
		audioRecorderStore.resumeRecording();
	};

	return {
		startRecording,
		stopRecording,
		pauseRecording,
		resumeRecording
	};
};
