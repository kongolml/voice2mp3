import { useMemo } from "react";

// store
import { useAudioRecorderStore } from "@/store/useAudioRecorder.store";

// components
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export const RecordingExporter = () => {
	const { audioBlob } = useAudioRecorderStore();

	const downloadUrl = useMemo(
		() => (audioBlob ? URL.createObjectURL(audioBlob) : undefined),
		[audioBlob],
	);

	return (
		<>
			You can{" "}
			<Popover>
				<PopoverTrigger asChild>
					<Button size="xs" disabled={!downloadUrl} variant="outline">
						preview
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start">
					{audioBlob && (
						<audio src={downloadUrl} controls className="w-full h-[30px]" />
					)}
				</PopoverContent>
			</Popover>{" "}
			recording or
			<Button size="xs" disabled={!downloadUrl} variant="outline">
				<a href={downloadUrl} download="session-recording.mp3">
					download mp3
				</a>
			</Button>{" "}
			after the session.
		</>
	);
};
