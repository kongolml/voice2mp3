// types
import type { RawAudioWorkerOutputMessage } from "@/meta/workers.meta";

class RawAudioProcessor extends AudioWorkletProcessor {
    process(
        inputs: Float32Array[][],
        _outputs: Float32Array[][],
        _params: Record<string, Float32Array>,
    ): boolean {
        const input = inputs[0];
        if (input && input[0] && input[0].length > 0) {
            // send raw audio data further
            this.port.postMessage({ type: 'raw-audio', rawAudio: new Float32Array(input[0]) } satisfies RawAudioWorkerOutputMessage);  // Copy the buffer — input buffers are reused by the audio thread
        }
        return true;
    }
}

registerProcessor('raw-audio-processor', RawAudioProcessor);