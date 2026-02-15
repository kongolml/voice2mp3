import { useEffect, useRef } from "react";

// hooks
import { useDrawWaveform } from "@/hooks/useDrawWaveform";

// meta
import { RecorderStatesEnum } from "@/meta/recorder.meta";

// store
import { useAudioRecorderStore } from "@/store/useAudioRecorder.store";

export const Visualizer = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const { audioAnalyser, recorderState } = useAudioRecorderStore();

	useDrawWaveform(
		canvasRef,
		audioAnalyser,
		recorderState === RecorderStatesEnum.RECORDING,
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const resizeCanvas = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		};

		resizeCanvas();

		// add event listeners
		window.addEventListener("resize", resizeCanvas);

		// cleanup
		return () => window.removeEventListener("resize", resizeCanvas);
	}, []);

	return (
		<canvas
			ref={canvasRef}
			style={{
				width: "100%",
				height: "120px",
				background: "#f5f5f5",
				display: "block",
			}}
		/>
	);
};
