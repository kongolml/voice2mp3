// components
import { Controls } from "@/components/AudioRecorder/Controls";
import { Visualizer } from "@/components/AudioRecorder/Visualizer";
import { Timer } from "@/components/AudioRecorder/Timer";
import { RecordingExporter } from "@/components/AudioRecorder/RecordingExporter";
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner"; // required for toaster

// hooks
import { useAudioRecorderTimer } from "@/hooks/useAudioRecorderTimer";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

// store
import { useAudioRecorderStore } from "@/store/useAudioRecorder.store";

// meta
import { RecorderStatesEnum } from "@/meta/recorder.meta";

const MAX_RECORDINNG_DURATION_SECONDS_IN_HOURS = 4;
const MAX_RECORDINNG_DURATION_SECONDS =
	1000 * 60 * 60 * MAX_RECORDINNG_DURATION_SECONDS_IN_HOURS; // 4 hours

// TODO: make this a custom component
export const AudioRecorder = () => {
	const onMaxRecordingDurationReached = () => {
		toast.warning(
			`Demo alert: quota (${MAX_RECORDINNG_DURATION_SECONDS_IN_HOURS} hours) reached`,
			{
				position: "top-center",
			},
		);
		stopRecording();
	};

	const { totalTime, startTimer, pauseTimer, resumeTimer, stopTimer } =
		useAudioRecorderTimer({
			maxRecordingDurationSeconds: MAX_RECORDINNG_DURATION_SECONDS,
			onMaxRecordingDurationReached,
		});

	const { recorderState } = useAudioRecorderStore();

	const {
		startNewRecording: startRecorder,
		stopRecording: stopRecorder,
		pauseRecording: pauseRecorder,
		resumeRecording: resumeRecorder,
	} = useAudioRecorder();

	const startRecording = async () => {
		await startRecorder();
		startTimer();
	};

	const stopRecording = () => {
		stopRecorder();
		stopTimer();
	};

	const pauseRecording = () => {
		pauseTimer();
		pauseRecorder();
	};

	const resumeRecording = () => {
		resumeTimer();
		resumeRecorder();
	};

	return (
		<div className="relative flex w-full max-w-sm flex-col items-center">
			<Card className="relative w-full pt-0">
				<Visualizer />

				<CardHeader>
					<CardAction>
						<Timer totalTime={totalTime} />
					</CardAction>

					<CardTitle>Audio Recorder</CardTitle>

					<CardDescription>
						<RecordingExporter />
					</CardDescription>
				</CardHeader>

				<CardFooter>
					<Controls
						onStartRecording={startRecording}
						onStopRecording={stopRecording}
						onPauseRecording={pauseRecording}
						onResumeRecording={resumeRecording}
					/>
				</CardFooter>
			</Card>

			{recorderState === RecorderStatesEnum.RECORDING && (
					<Button
						size="xs"
						variant="destructive"
						className="absolute top-full mt-2"
						onClick={onMaxRecordingDurationReached}
					>
						Fake max recording duration reached
					</Button>
			)}

			<Toaster />
		</div>
	);
};
