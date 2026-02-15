import { useState, useEffect, useRef } from "react";

const MAX_RECORDINNG_DURATION_SECONDS = 1000 * 60 * 60 * 4; // 4 hours
const TICK_INTERVAL_MS = 200;

interface UseAudioRecorderTimerProps {
	onMaxRecordingDurationReached: () => void;
}

export const useAudioRecorderTimer = ({
	onMaxRecordingDurationReached,
}: UseAudioRecorderTimerProps) => {
	const [totalTime, setTotalTime] = useState(0);
	const intervalRef = useRef<number | null>(null);
	const startTimeUnixRef = useRef<number>(0);
	const totalTimeSecondsRef = useRef<number>(0);

	const resetTimer = () => {
		// setTotalTime(0);
		startTimeUnixRef.current = 0;
		totalTimeSecondsRef.current = 0;
		clearTimer();
	};

	const clearTimer = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	};

	const startTimer = () => {
		startTimeUnixRef.current = Date.now();

		intervalRef.current = setInterval(() => {
			const totalTimeMs = Date.now() - startTimeUnixRef.current;

			totalTimeSecondsRef.current = totalTimeMs / 1000;
			setTotalTime(totalTimeSecondsRef.current);

			if (totalTimeMs >= MAX_RECORDINNG_DURATION_SECONDS) {
				onMaxRecordingDurationReached();
			}
		}, TICK_INTERVAL_MS);
	};

	const pauseTimer = () => {
		clearTimer();
	};

	const resumeTimer = () => {
		const baseTime = totalTimeSecondsRef.current; // timestamp when we paused
		startTimeUnixRef.current = Date.now();

		intervalRef.current = setInterval(() => {
			totalTimeSecondsRef.current =
				baseTime + (Date.now() - startTimeUnixRef.current) / 1000;
			setTotalTime(totalTimeSecondsRef.current);
		}, TICK_INTERVAL_MS);
	};

	const stopTimer = () => {
		resetTimer();
	};

	useEffect(() => {
		clearTimer();
	}, []);

	return {
		totalTime,
		startTimer,
		pauseTimer,
		resumeTimer,
		stopTimer,
	};
};
