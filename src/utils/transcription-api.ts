const MOCK_TRANSCRIPT = `This is a dummy transcription generate by mock API.`;

const MOCK_DELAY_MS = 2000;

export const transcribeAudio = (_blob: Blob): Promise<string> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(MOCK_TRANSCRIPT);
		}, MOCK_DELAY_MS);
	});
};
