export function formatWords(words: string) {
	return words
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

export function roundOff(num: number, decimalPlaces: number = 1) {
	return Math.round(num * 10 ** decimalPlaces) / 10 ** decimalPlaces;
}