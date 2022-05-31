import fs from 'fs';
import nsblob from 'nsblob';
import path from 'path';
import { Options } from './options';

export async function upload_buffer(buf: Buffer | string) {
	return nsblob.store(buf);
}

export async function createDirectoryListing(
	dir: string,
	opts: Options
): Promise<string | Buffer> {
	const list = await fs.promises.readdir(dir);
	let ret = Array<string>();
	for (const i of list) {
		const fullpath = path.resolve(dir, i);
		if (fullpath.match(opts.exclude)) {
			ret.push(`${fullpath} was excluded.`);
		} else {
			const hash = await upload(fullpath, opts);
			const parts = path.parse(fullpath);
			ret.push(
				`<li><a href="/${hash}/${parts.base}">${parts.base}</a></li>`
			);
		}
	}
	return (
		`<h1>Index of ${path.basename(dir)}</h1><ul>` + ret.join('\n') + '</ul>'
	);
}

export async function upload_logic(
	file: string,
	opts: Options
): Promise<string | Buffer> {
	try {
		if (file.match(opts.exclude)) {
			return `${file} was excluded.`;
		}
		const stat = await fs.promises.stat(file);
		if (stat.isFile()) {
			return fs.promises.readFile(file);
		} else if (stat.isDirectory()) {
			return createDirectoryListing(file, opts);
		} else {
			return `${file} is not readable.`;
		}
	} catch (error) {
		return String(error);
	}
}

export async function upload(file: string, opts: Options) {
	return upload_buffer(await upload_logic(file, opts));
}
