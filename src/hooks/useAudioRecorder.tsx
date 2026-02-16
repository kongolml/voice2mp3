import { useCallback, useRef } from "react";

// store
import { useAudioRecorderStore } from "@/store/useAudioRecorder.store";
import { useTranscriptionStore } from "@/store/useTranscription.store";

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
import { transcribeAudio } from "@/utils/transcription-api";

const RAW_AUDIO_PROCESSOR_URL = new URL(
	"../workers/raw-audio-processor.worklet.ts",
	import.meta.url,
);

export const useAudioRecorder = () => {
	const audioRecorderStore = useAudioRecorderStore();
	const transcriptionStore = useTranscriptionStore();
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
	const cleanup = useCallback(() => {
		streamRef.current?.getTracks().forEach((t) => t.stop()); // stop mic capture
		streamRef.current = null;
		audioCtxRef.current?.close();
		audioCtxRef.current = null;
		analyserRef.current = null;
		workletNodeRef.current = null;
		mp3WorkerRef.current?.terminate();
		mp3WorkerRef.current = null;
		sessionIdRef.current = null;
	}, []);

	/**
	 * Request access to microphone, then starts recording by splitting audio
	 * into chunks (as discussed previously) of AUDIO_CHUNKS_LENGTH_MS seconds.
	 * Then we glue chunks together to form a single audio file in the end.
	 */
	const startNewRecording = async () => {
		try {
			if (audioRecorderState !== RecorderStatesEnum.IDLE) return;

			audioRecorderStore.reset();
			transcriptionStore.reset();

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
				} else if (msg.type === "error") {
					console.error(msg.error);
				}
			};

			audioRecorderStore.startRecording();
		} catch (error) {
			console.error(
				"Error starting recording, probably you have denied access to microphone",
				error,
			);
			cleanup();
			return;
		}
	};

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

		// Resume AudioContext if paused so the worker can flush remaining data
		if (audioCtxRef.current?.state === "suspended") {
			await audioCtxRef.current.resume();
		}

		workletNodeRef.current?.disconnect();

		// Send finish and wait untill last chuks are procecssed
		await new Promise<void>((resolve, reject) => {
			mp3Worker.onmessage = (e: MessageEvent<Mp3WorkerAllMessages>) => {
				const msg = e.data;
				if (msg.type === "encoded") {
					appendChunk(sessionId, msg.mp3Chunk);
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

		// finalize by reading all chunks from indexeddb and concating into single mp3 blob
		const blob = await finalizeSession(sessionId);
		audioRecorderStore.setAudioBlob(blob);

		cleanup();
		audioRecorderStore.stopRecording();

		// trigger transcription in the background
		transcriptionStore.setTranscriptionStatus("processing");
		transcribeAudio(blob)
			.then((text) => {
				transcriptionStore.setTranscription(text);
				transcriptionStore.setTranscriptionStatus("complete");
			})
			.catch(() => {
				transcriptionStore.setTranscriptionStatus("error");
			});
	}, [cleanup, audioRecorderStore, transcriptionStore]);

	const pauseRecording = useCallback(async () => {
		if (audioRecorderState !== RecorderStatesEnum.RECORDING) return;
		await audioCtxRef.current?.suspend();
		audioRecorderStore.pauseRecording();
	}, [audioRecorderState, audioRecorderStore]);

	const resumeRecording = useCallback(async () => {
		if (audioRecorderState !== RecorderStatesEnum.PAUSED) return;
		await audioCtxRef.current?.resume();
		audioRecorderStore.resumeRecording();
	}, [audioRecorderState, audioRecorderStore]);

	return {
		startNewRecording,
		stopRecording,
		pauseRecording,
		resumeRecording,
	};
};
