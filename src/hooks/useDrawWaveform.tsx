import { useRef, useEffect } from "react";

const colorsMap = {
	waveColor: "#292524",
	backgroundColor: "#f5f5f5"
};

export const useDrawWaveform = (
	canvasRef: React.RefObject<HTMLCanvasElement | null>,
	audioAnalyser: AnalyserNode | null,
	play: boolean,
) => {
	const canvas = canvasRef.current;
	const requestAnimationFrameRef = useRef<number>(0);

	const drawWaveform = () => {
		if (!canvas || !audioAnalyser) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const bufferLength = audioAnalyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);

		const render = () => {
			requestAnimationFrameRef.current = requestAnimationFrame(render);
			audioAnalyser.getByteTimeDomainData(dataArray);

			const { width, height } = canvas;
			ctx.fillStyle = colorsMap.backgroundColor;
			ctx.fillRect(0, 0, width, height);

			ctx.lineWidth = 2;
			ctx.strokeStyle = colorsMap.waveColor;
			ctx.beginPath();

			const sliceWidth = width / bufferLength;
			let x = 0;

			for (let i = 0; i < bufferLength; i++) {
				const v = dataArray[i] / 128.0;
				const y = (v * height) / 2;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
				x += sliceWidth;
			}

			ctx.lineTo(width, height / 2);
			ctx.stroke();
		};

		render();
	};

	const drawIdleCanvas = () => {
		cancelAnimationFrame(requestAnimationFrameRef.current);
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");

		if (ctx) {
			const { width, height } = canvas;

			ctx.fillStyle = colorsMap.backgroundColor;
			ctx.fillRect(0, 0, width, height);
			ctx.lineWidth = 2;
			ctx.strokeStyle = colorsMap.waveColor;
			ctx.beginPath();
			ctx.moveTo(0, height / 2);
			ctx.lineTo(width, height / 2);
			ctx.stroke();
		}
	};

	useEffect(() => {
		play ? drawWaveform() : drawIdleCanvas();
	}, [play]);
};
