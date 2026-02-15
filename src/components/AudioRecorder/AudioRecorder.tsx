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

// hooks
import { useAudioRecorderTimer } from "@/hooks/useAudioRecorderTimer";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

// TODO: make this a custom component
export const AudioRecorder = () => {
	const onMaxRecordingDurationReached = () => {
		stopRecording();
	};

	const { totalTime, startTimer, pauseTimer, resumeTimer, stopTimer } =
		useAudioRecorderTimer({ onMaxRecordingDurationReached });

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
		<Card className="relative mx-auto w-full max-w-sm pt-0">
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
	);
};
