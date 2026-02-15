import { create } from "zustand";

// meta
import { RecorderStatesEnum } from "@/meta/recorder.meta";

// types
import type { RecorderState } from "@/types/recorder";

type AudioRecorderStore = {
    recorderState: RecorderState;
    startRecording: () => void;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    audioBlob: Blob | null;
    setAudioBlob: (audioBlob: Blob) => void;
    audioAnalyser: AnalyserNode | null;
    setAudioAnalyser: (audioAnalyser: AnalyserNode) => void;
    reset: () => void;
};

export const useAudioRecorderStore = create<AudioRecorderStore>((set) => ({
    recorderState: RecorderStatesEnum.IDLE,
    startRecording: () => set({ recorderState: RecorderStatesEnum.RECORDING }),
    stopRecording: () => set({ recorderState: RecorderStatesEnum.IDLE }),
    pauseRecording: () => set({ recorderState: RecorderStatesEnum.PAUSED }),
    resumeRecording: () => set({ recorderState: RecorderStatesEnum.RECORDING }),
    audioBlob: null,
    setAudioBlob: (audioBlob: Blob) => set({ audioBlob }),
    audioAnalyser: null,
    setAudioAnalyser: (audioAnalyser: AnalyserNode) => set({ audioAnalyser }),
    reset: () => set({ recorderState: RecorderStatesEnum.IDLE, audioBlob: null, audioAnalyser: null }),
}));