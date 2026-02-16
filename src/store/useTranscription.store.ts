import { create } from "zustand";

type TranscriptionStatus = "idle" | "processing" | "complete" | "error";

type TranscriptionStore = {
    transcription: string | null;
    transcriptionStatus: TranscriptionStatus;
    setTranscription: (text: string) => void;
    setTranscriptionStatus: (status: TranscriptionStatus) => void;
    reset: () => void;
};

export const useTranscriptionStore = create<TranscriptionStore>((set) => ({
    transcription: null,
    transcriptionStatus: "idle",
    setTranscription: (text: string) => set({ transcription: text }),
    setTranscriptionStatus: (status: TranscriptionStatus) => set({ transcriptionStatus: status }),
    reset: () => set({ transcription: null, transcriptionStatus: "idle" }),
}));
