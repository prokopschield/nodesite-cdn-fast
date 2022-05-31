import nsblob from 'nsblob';

export async function download(hash: string): Promise<Buffer> {
	return nsblob.fetch(hash);
}
