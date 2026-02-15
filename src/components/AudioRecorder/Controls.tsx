import { Circle, Pause, Play, Square } from "lucide-react";

// components
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Spinner } from "@/components/ui/spinner";

// store
import { useAudioRecorderStore } from "@/store/useAudioRecorder.store";

// meta
import { RecorderStatesEnum } from "@/meta/recorder.meta";

interface ControlsProps {
	onStartRecording: () => void;
	onStopRecording: () => void;
	onPauseRecording: () => void;
	onResumeRecording: () => void;
}

export const Controls = ({
	onStartRecording,
	onStopRecording,
	onPauseRecording,
	onResumeRecording,
}: ControlsProps) => {
	const { recorderState } = useAudioRecorderStore();

	const startRecording = () => {
		onStartRecording();
	};

	const pauseRecording = () => {
		onPauseRecording();
	};

	const resumeRecording = () => {
		onResumeRecording();
	};

	const stopRecording = () => {
		onStopRecording();
	};

	const playPauseRecording = () => {
		if (recorderState === RecorderStatesEnum.RECORDING) {
			pauseRecording();
		} else {
			resumeRecording();
		}
	};

	return (
		<ButtonGroup className="w-full">
			<Button
				onClick={startRecording}
				disabled={
					recorderState === RecorderStatesEnum.RECORDING ||
					recorderState === RecorderStatesEnum.PAUSED
				}
				variant="outline"
				size="sm"
				className="flex-1"
			>
				{recorderState === RecorderStatesEnum.RECORDING ? (
					<Spinner data-icon="inline-start" />
				) : (
					<Circle />
				)}
				{recorderState === RecorderStatesEnum.RECORDING
					? "Recording"
					: "Record"}
			</Button>

			<Button
				onClick={playPauseRecording}
				disabled={
					recorderState === RecorderStatesEnum.IDLE
				}
				variant="outline"
				size="sm"
				className="flex-1"
			>
				{recorderState === RecorderStatesEnum.PAUSED ? (
					<>
						<Play />
						Resume
					</>
				) : (
					<>
						<Pause />
						Pause
					</>
				)}
			</Button>

			<Button
				onClick={stopRecording}
				disabled={
					recorderState !== RecorderStatesEnum.RECORDING &&
					recorderState !== RecorderStatesEnum.PAUSED
				}
				variant="outline"
				size="sm"
				className="flex-1"
			>
				<Square />
				Stop
			</Button>
		</ButtonGroup>
	);
};
