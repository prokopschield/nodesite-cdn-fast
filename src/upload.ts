import fs from 'fs';
import path from 'path';

import nsblob from './nsblob';
import { Options } from './options';

export async function upload_buffer(buf: Buffer | string) {
	return nsblob.store(buf);
}

export async function createDirectoryListing(
	dir: string,
	options: Options,
	throw_errors: boolean = false
): Promise<string | Buffer> {
	try {
		const list = await fs.promises.readdir(dir);
		const returnValue = new Array<string>();

		for (const index of list) {
			try {
				const fullpath = path.resolve(dir, index);

				if (fullpath.match(options.exclude)) {
					returnValue.push(`<li>${fullpath} was excluded.</li>`);
				} else {
					const stat = await fs.promises.stat(fullpath);
					const hash = await upload(fullpath, options, true);
					const parts = path.parse(fullpath);

					if (stat.isDirectory()) {
						returnValue.push(
							`<li><a href="/${hash}/${parts.name}.html">${index}/</a></li>`
						);
					} else if (stat.isFile()) {
						returnValue.push(
							`<li><a href="/${hash}/${index}">${index}</a></li>`
						);
					} else {
						returnValue.push(
							`<li>${index} is not a file or directory.`
						);
					}
				}
			} catch {
				returnValue.push(`<li>${index} was inaccessible.</li>`);
			}
		}

		return [
			`<h1>Index of ${path.basename(dir)}</h1>`,
			'',
			'<ul>',
			...returnValue.map((li) => `\t${li}`),
			'</ul>',
			'',
		].join('\n');
	} catch (error) {
		if (throw_errors) {
			throw error;
		} else {
			return String(error);
		}
	}
}

export async function upload_logic(
	file: string,
	options: Options,
	throw_errors: boolean = false
): Promise<string | Buffer> {
	try {
		if (file.match(options.exclude)) {
			return `${file} was excluded.`;
		}

		const stat = await fs.promises.stat(file);

		if (stat.isFile()) {
			return fs.promises.readFile(file);
		} else if (stat.isDirectory()) {
			return createDirectoryListing(file, options, throw_errors);
		} else {
			return `${file} is not readable.`;
		}
	} catch (error) {
		if (throw_errors) {
			throw error;
		} else {
			return String(error);
		}
	}
}

export async function upload(
	file: string,
	options: Options,
	throw_errors: boolean = false
) {
	return upload_buffer(await upload_logic(file, options, throw_errors));
}
