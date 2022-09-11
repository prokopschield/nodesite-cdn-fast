#!/usr/bin/env node

import argv from '@prokopschield/argv';
import fs from 'fs';
import nsblob from 'nsblob';
import path from 'path';

import { download, upload } from '.';

async function main() {
	const exclude = new RegExp(
		argv.alias('exclude', 'e').named.exclude || '^__NODESITE_CDN_EXCLUDE__$'
	);
	const options = {
		exclude,
		verbose: !!argv.alias('verbose', 'v').named.verbose,
	};
	const command = argv.ordered.shift()?.toLowerCase();

	switch (command) {
		case 'upload': {
			for (const file of argv.ordered) {
				console.log(await upload(path.resolve(file), options));
			}

			return 0;
		}
		case 'download': {
			const output_d = argv.alias('output', 'o').named.output;
			const output_d_stat = await fs.promises
				.stat(output_d)
				.catch(() => {});
			const output_d_is_dir = output_d_stat
				? output_d_stat.isDirectory()
				: false;

			if (output_d_is_dir) {
				for (const hash of argv.ordered) {
					const data = await download(hash);

					await fs.promises.writeFile(
						path.resolve(output_d, hash),
						data
					);
				}
			} else if (output_d) {
				for (const hash of argv.ordered) {
					const data = await download(hash);

					if (fs.existsSync(output_d)) {
						console.error(`Output file ${output_d} exists!`);

						return 1;
					} else {
						await fs.promises.writeFile(output_d, data);
					}
				}
			} else {
				for (const hash of argv.ordered) {
					const data = await download(hash);

					await fs.promises.writeFile(path.resolve(hash), data);
				}
			}

			return 0;
		}
		case 'cat': {
			for (const hash of argv.ordered) {
				const data = await download(hash);

				process.stdout.write(data);
			}

			return 0;
		}
		default: {
			console.error(`Unknown command: ${command}`);
			console.error('Known commands: cat, download, upload');

			return 1;
		}
	}
}

main().then(() => nsblob.socket.close());
