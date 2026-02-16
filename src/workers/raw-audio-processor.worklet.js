// we keep this file as JS to avoid vite issues with inline loading

class RawAudioProcessor extends AudioWorkletProcessor {
    process(
        inputs,
        _outputs,
        _params,
    ) {
        const input = inputs[0];
        if (input && input[0] && input[0].length > 0) {
            // send raw audio data further
            this.port.postMessage({ type: 'raw-audio', rawAudio: new Float32Array(input[0]) });  // Copy the buffer — input buffers are reused by the audio thread
        }
        return true;
    }
}

registerProcessor('raw-audio-processor', RawAudioProcessor);