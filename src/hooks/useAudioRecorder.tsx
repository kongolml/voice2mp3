import { useRef } from "react";

// store
import { useAudioRecorderStore } from "@/store/useAudioRecorder.store";

// meta
import { RecorderStatesEnum } from "@/meta/recorder.meta";

const AUDIO_CHUNKS_LENGTH_MS = 5000; // 5secs, can be controlled from env vars in future

export const useAudioRecorder = () => {
	const audioRecorderStore = useAudioRecorderStore();
	const audioRecorderState = audioRecorderStore.recorderState;
	const audioBlob = audioRecorderStore.audioBlob;
	const audioAnalyser = audioRecorderStore.audioAnalyser;

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const audioCtxRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	/**
	 * Stop the stream, closes audio context and resets all refs to null.
	 * This removes all UI elements and prevents memory leaks.
	 */
	const cleanup = () => {
		streamRef.current?.getTracks().forEach(t => t.stop());
		streamRef.current = null;
		audioCtxRef.current?.close();
		audioCtxRef.current = null;
		analyserRef.current = null;
		mediaRecorderRef.current = null;
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
			streamRef.current = audioStream;

			const mediaRecorder = new MediaRecorder(audioStream);
			mediaRecorderRef.current = mediaRecorder; // single ref to use in other methods

			const audioCtx = new AudioContext();
			audioCtxRef.current = audioCtx;

			const streamAudioSource = audioCtx.createMediaStreamSource(audioStream);
			const analyser = audioCtx.createAnalyser();
			analyser.fftSize = 256;
			streamAudioSource.connect(analyser);
			analyserRef.current = analyser;
			audioRecorderStore.setAudioAnalyser(analyser);

			mediaRecorder.start(AUDIO_CHUNKS_LENGTH_MS);

			// When a new chunk of audio is available -  add it to the chunks list
			mediaRecorder.ondataavailable = (event) => {
				audioChunksRef.current.push(event.data);
			};

			mediaRecorder.onstop = () => {
				// TODO: check this -  audioStream.getTracks().forEach(track => track.stop());
				// this can be immediatelly saved somewhere for offline usage etc.
				const audioBlob = new Blob(audioChunksRef.current, {
					type: "audio/webm",
				});
				audioRecorderStore.setAudioBlob(audioBlob);
				audioRecorderStore.stopRecording();
				cleanup();
			};

			mediaRecorder.onpause = () => {
				audioRecorderStore.pauseRecording();
			};

			mediaRecorder.onresume = () => {
				audioRecorderStore.resumeRecording();
			};

			audioRecorderStore.startRecording();
		} catch (error) {
			console.error(
				"Error starting recording, probably you have denied access to microphone",
			);
			cleanup();
			return;
		}
	};
	const stopRecording = () => {
		if (
			audioRecorderState !== RecorderStatesEnum.RECORDING &&
			audioRecorderState !== RecorderStatesEnum.PAUSED
		) {
			return;
		}

		mediaRecorderRef.current?.stop();
		audioRecorderStore.stopRecording();
	};
	const pauseRecording = () => {
		if (audioRecorderState !== RecorderStatesEnum.RECORDING) return;
		mediaRecorderRef.current?.pause();
		audioRecorderStore.pauseRecording();
	};
	const resumeRecording = () => {
		if (audioRecorderState !== RecorderStatesEnum.PAUSED) return;
		mediaRecorderRef.current?.resume();
		audioRecorderStore.resumeRecording();
	};

	return {
		recorderState: audioRecorderState,
		startRecording,
		stopRecording,
		pauseRecording,
		resumeRecording,
		audioBlob,
		audioAnalyser,
	};
};
