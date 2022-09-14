import blake2 from 'blake2';

export function blake2sHex(content: Buffer | string) {
	const context = blake2.createHash('blake2s');

	context.write(content);

	return context.digest('hex');
}
