import { useRef, useState } from "react";
import { Download } from "lucide-react";

// store
import { useAudioRecorderStore } from "@/store/useAudioRecorder.store";

// components
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

const getWorker = () => {
	return new Worker(
		new URL("../../workers/lame-js.worker.ts", import.meta.url),
		{ type: "module" },
	);
};

export const RecordingExporter = () => {
	const { audioBlob } = useAudioRecorderStore();
	const [downloadMp3RecordingUrl, setDownloadMp3RecordingUrl] =
		useState<string>();
	const [encodingProgress, setEncodingProgress] = useState<number>(0);
	const LameJsWorkerRef = useRef<Worker | null>(null);

	const getOrCreateWorker = () => {
		if (!LameJsWorkerRef.current) {
			LameJsWorkerRef.current = getWorker();
		}
		return LameJsWorkerRef.current;
	};

	const resetState = () => {
		setDownloadMp3RecordingUrl(undefined);
		setEncodingProgress(0);
	};

	const downloadMp3Recording = () => {
		const worker = getOrCreateWorker();

		const exportPromise = new Promise<Blob>(async (resolve, reject) => {
			worker.onmessage = (event) => {
				if (event.data.type === "success") {
					resolve(event.data.mp3Blob);
					worker.terminate();
				}

				if (event.data.type === "progress") {
					setEncodingProgress(event.data.progress);
				}
			};

			worker.onerror = (event) => {
				worker.terminate();
				reject(event.message);
			};

			const audioArrayBuffer = await audioBlob?.arrayBuffer();
			if (!audioArrayBuffer) {
				reject(new Error("Audio blob is not valid"));
				return;
			}

			// we do this part here, because we cannot pass the audio buffer directly to the worker
			// annd we cannot do all that in the worker, because neither AudioContext nor OfflineAudioContext are available in the worker
			const audioCtx = new OfflineAudioContext(1, 1, 44100);
			const audioBuffer = await audioCtx.decodeAudioData(audioArrayBuffer);
			const float32 = new Float32Array(audioBuffer.getChannelData(0));

			worker.postMessage(
				{
					type: "export-mp3",
					samples: float32.buffer,
					sampleRate: audioBuffer.sampleRate,
				},
				[float32.buffer],
			);
		});

		exportPromise
			.then((mp3Blob) => {
				const url = URL.createObjectURL(mp3Blob);
				setDownloadMp3RecordingUrl(url);
				resetState();
			})
			.catch(console.error);
	};

	return (
		<>
			{!encodingProgress && (
				<>
					You can{" "}
					<Button
						onClick={downloadMp3Recording}
						size="xs"
						disabled={!audioBlob || encodingProgress > 0}
						variant="outline"
					>
						export it to mp3
					</Button>{" "}
					after the session or{" "}
					<Popover>
						<PopoverTrigger asChild>
							<Button
								size="xs"
								disabled={!audioBlob || encodingProgress > 0}
								variant="outline"
							>
								preview
							</Button>
						</PopoverTrigger>
						<PopoverContent align="start">
							{audioBlob && (
								<audio
									src={URL.createObjectURL(audioBlob)}
									controls
									className="w-full h-[30px]"
								/>
							)}
						</PopoverContent>
					</Popover>{" "}
					it.
				</>
			)}

			{encodingProgress > 0 ||
				(downloadMp3RecordingUrl && (
					<div className="flex gap-4 flex-nowrap items-center">
						{encodingProgress > 0 && (
							<Progress value={encodingProgress * 100} />
						)}
						{downloadMp3RecordingUrl && (
							<Button asChild size="xs" variant="outline">
								<a href={downloadMp3RecordingUrl} download="recording.mp3">
									<Download />
								</a>
							</Button>
						)}
					</div>
				))}
		</>
	);
};
