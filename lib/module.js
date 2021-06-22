// NPM Dependencies
const { filter } = require('rxjs/operators');
const { spawn } = require('child_process');

// Local Depdendencies
const logger = require('./logger');
const { version } = require('../package.json');

let defaults = {};

module.exports = class FunModule {
	/**
	 * @param {ClientWrapper} client
	 * @param {object} options
	 */
	constructor(client, options) {
		/** @type {object} */
		this.settings = { ...defaults, ...options };
		/** @type {string} */
		this.version = version;

		//  ____  _
		// / ___|| |_ _ __ ___  __ _ _ __ ___  ___
		// \___ \| __| '__/ _ \/ _` | '_ ` _ \/ __|
		//  ___) | |_| | |  __/ (_| | | | | | \__ \
		// |____/ \__|_|  \___|\__,_|_| |_| |_|___/
		//

		let figlet$ = client.privmsg$.pipe(
			filter(message => message.text.startsWith('!figlet'))
		);

		let cowsay$ = client.privmsg$.pipe(
			filter(message => message.text.startsWith('!cowsay'))
		);

		let fortune$ = client.privmsg$.pipe(
			filter(message => message.text.startsWith('!fortune'))
		);

		let fortunesay$ = client.privmsg$.pipe(
			filter(message => message.text.startsWith('!fortunesay'))
		);

		let roll$ = client.privmsg$.pipe(
			filter(message => message.text.startsWith('!roll'))
		);

		//  ____        _                   _       _   _
		// / ___| _   _| |__  ___  ___ _ __(_)_ __ | |_(_) ___  _ __  ___
		// \___ \| | | | '_ \/ __|/ __| '__| | '_ \| __| |/ _ \| '_ \/ __|
		//  ___) | |_| | |_) \__ \ (__| |  | | |_) | |_| | (_) | | | \__ \
		// |____/ \__,_|_.__/|___/\___|_|  |_| .__/ \__|_|\___/|_| |_|___/
		//                                   |_|
		//

		figlet$.subscribe(message => {
			let text = message.text.substring(8).trim();

			function speak(text) {
				client.actionOut$.next({
					command: 'PRIVMSG',
					target: message.target,
					prefix: ' ',
					text,
				});
			}

			if (text.length === 0) {
				client.actionOut$.next({
					command: 'NOTICE',
					target: message.sender,
					text: 'No text provided.',
				});
			} else {
				let params = [];

				if (/\[[\w\d-]+\] .+/i.test(text)) {
					let [, file, text_trimmed] = text.match(/\[([\w\d-]+)\] (.+)/i);

					params.push(`-f${file}`);
					params.push(text_trimmed);
				} else {
					params.push(text);
				}

				logger.info('FIGLET', ...params);

				let figlet = spawn('figlet', params);

				figlet.stderr.on('data', speak);
				figlet.stdout.on('data', speak);
			}
		});

		cowsay$.subscribe(message => {
			let text = message.text.substring(8).trim();

			function speak(text) {
				client.actionOut$.next({
					command: 'PRIVMSG',
					target: message.target,
					prefix: ' ',
					text,
				});
			}

			if (text.length === 0) {
				client.actionOut$.next({
					command: 'NOTICE',
					target: message.sender,
					text: 'No text provided.',
				});
			} else {
				let params = [];

				if (/\[[a-z_-]+\] .+/i.test(text)) {
					let [, file, text_trimmed] = text.match(/\[([a-z_-]+)\] (.+)/i);

					params.push(`-f${file}`);
					params.push(text_trimmed);
				} else {
					params.push(text);
				}

				logger.info('COWSAY', ...params);

				let cowsay = spawn('cowsay', params);

				cowsay.stderr.on('data', speak);
				cowsay.stdout.on('data', speak);
			}
		});

		fortune$.subscribe(message => {
			logger.info('FORTUNE');

			function speak(text) {
				client.actionOut$.next({
					command: 'PRIVMSG',
					target: message.target,
					prefix: ' ',
					text,
				});
			}

			let fortune = spawn('fortune');

			fortune.stderr.on('data', speak);
			fortune.stdout.on('data', speak);
		});

		fortunesay$.subscribe(message => {
			logger.info('FORTUNESAY');

			function speak(text) {
				client.actionOut$.next({
					command: 'PRIVMSG',
					target: message.target,
					prefix: ' ',
					text,
				});
			}

			let fortune = spawn('fortune');
			let cowsay = spawn('cowsay');

			fortune.stdout.on('data', data => {
				cowsay.stdin.write(data);
			});

			fortune.stderr.on('data', speak);

			fortune.on('close', (code) => {
				if (code !== 0) {
					logger.error(`FORTUNESAY fortune exit ${code}`);
				}
				cowsay.stdin.end();
			});

			cowsay.stderr.on('data', speak);
			cowsay.stdout.on('data', speak);

			cowsay.on('close', (code) => {
				if (code !== 0) {
					logger.error(`FORTUNESAY cowsay exit ${code}`);
				}
			});
		});

		roll$.subscribe(message => {
			let dices = Number(message.text.substring(6).trim()) || 2;

			let rolls = Array.from({ length: dices })
				.map(() => Math.ceil(Math.random() * 6))
				.map(number => `[${number}]`)
				.join(' ');

			logger.info(`ROLL ${rolls}`);

			client.actionOut$.next({
				command: 'PRIVMSG',
				target: message.target,
				text: rolls,
			});
		});
	}
};
