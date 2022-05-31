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
	try {
		const list = await fs.promises.readdir(dir);
		let ret = Array<string>();
		for (const i of list) {
			try {
				const fullpath = path.resolve(dir, i);
				if (fullpath.match(opts.exclude)) {
					ret.push(`<li>${fullpath} was excluded.</li>`);
				} else {
					const stat = await fs.promises.stat(fullpath);
					const hash = await upload(fullpath, opts);
					const parts = path.parse(fullpath);

					if (stat.isDirectory()) {
						ret.push(
							`<li><a href="/${hash}/${parts.name}.html">${i}/</a></li>`
						);
					} else if (stat.isFile()) {
						ret.push(`<li><a href="/${hash}/${i}">${i}</a></li>`);
					} else {
						ret.push(`<li>${i} is not a file or directory.`);
					}
				}
			} catch (error) {
				ret.push(`<li>Unable to access ${i}</li>`);
			}
		}
		return (
			`<h1>Index of ${path.basename(dir)}</h1><ul>` + ret.join('\n') + '</ul>'
		);
	} catch (error) {
		return String(error);
	}
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
