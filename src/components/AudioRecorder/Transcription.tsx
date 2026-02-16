// store
import { useTranscriptionStore } from "@/store/useTranscription.store";

// components
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { LoaderCircle } from "lucide-react";
import { Button } from "../ui/button";

export const Transcription = () => {
	const { transcription, transcriptionStatus, setTranscriptionStatus } =
		useTranscriptionStore();

	const closeTranscription = () => {
		setTranscriptionStatus("idle");
	};

	if (transcriptionStatus === "idle") return null;

	return (
		<Card className="mt-4 w-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{transcriptionStatus === "processing"
						? "Transcribing"
						: "Transcription"}
					{transcriptionStatus === "processing" && (
						<LoaderCircle className="h-4 w-4 animate-spin" />
					)}
				</CardTitle>
			</CardHeader>

			<CardContent>
				{transcriptionStatus === "processing" && (
					<p className="text-muted-foreground text-sm">Transcribing audio...</p>
				)}
				{transcriptionStatus === "complete" && (
					<p className="text-sm">{transcription}</p>
				)}
				{transcriptionStatus === "error" && (
					<p className="text-destructive text-sm">
						Failed to transcribe audio. Please try again.
					</p>
				)}
			</CardContent>

			{transcriptionStatus === "complete" && (
				<CardFooter>
					<Button size="xs" variant="outline" onClick={closeTranscription}>
						Cool, thanks!
					</Button>
				</CardFooter>
			)}
		</Card>
	);
};
