// NPM Dependencies
const { filter } = require('rxjs/operators');
const { spawn } = require('child_process');

// Local Depdendencies
const { version } = require('../package.json');

let defaults = {
	logLevel: 'error'
};

module.exports = class FunModule {
	/**
	 * @param {ClientWrapper} client
	 * @param {object} options
	 * @param {string} options.logLevel='error'
	 */
	constructor(client, options) {
		/** @type {object} */
		this.settings = { ...defaults, ...options };
		/** @type {string} */
		this.version = version;

		let { logger } = client;

		//  ____  _
		// / ___|| |_ _ __ ___  __ _ _ __ ___  ___
		// \___ \| __| '__/ _ \/ _` | '_ ` _ \/ __|
		//  ___) | |_| | |  __/ (_| | | | | | \__ \
		// |____/ \__|_|  \___|\__,_|_| |_| |_|___/
		//

		let privmsg$ = client.raw$.pipe(
			filter(message => message.command === 'PRIVMSG')
		);

		let figlet$ = privmsg$.pipe(
			filter(message => message.args[1].startsWith('!figlet'))
		);

		let cowsay$ = privmsg$.pipe(
			filter(message => message.args[1].startsWith('!cowsay'))
		);

		let fortune$ = privmsg$.pipe(
			filter(message => message.args[1] === '!fortune')
		);

		let fortunesay$ = privmsg$.pipe(
			filter(message => message.args[1] === '!fortunesay')
		);

		let roll$ = privmsg$.pipe(
			filter(message => message.args[1].startsWith('!roll'))
		);

		//  ____        _                   _       _   _
		// / ___| _   _| |__  ___  ___ _ __(_)_ __ | |_(_) ___  _ __  ___
		// \___ \| | | | '_ \/ __|/ __| '__| | '_ \| __| |/ _ \| '_ \/ __|
		//  ___) | |_| | |_) \__ \ (__| |  | | |_) | |_| | (_) | | | \__ \
		// |____/ \__,_|_.__/|___/\___|_|  |_| .__/ \__|_|\___/|_| |_|___/
		//                                   |_|
		//

		figlet$.subscribe(message => {
			let nick = message.args[0];
			let text = message.args[1].substring(8).trim();

			if (text.length === 0) {
				client.tell(nick, 'No text provided.');
			} else {
				let params = [];

				if (/\[[\w\d-]+\] .+/i.test(text)) {
					let [, file, text_trimmed] = text.match(/\[([\w\d-]+)\] (.+)/i);

					params.push(`-f${file}`);
					params.push(text_trimmed);
				} else {
					params.push(text);
				}

				logger.info('RxBot Fun - FIGLET ' + params.join(' '));

				let figlet = spawn('figlet', params);

				figlet.stderr.on('data', data => client.tell(nick, data, ' '));
				figlet.stdout.on('data', data => client.tell(nick, data, ' '));
			}
		});

		cowsay$.subscribe(message => {
			let nick = message.args[0];
			let text = message.args[1].substring(8).trim();

			if (text.length === 0) {
				client.tell(nick, 'No text provided.');
			} else {
				let params = [];

				if (/\[[a-z_-]+\] .+/i.test(text)) {
					let [, file, text_trimmed] = text.match(/\[([a-z_-]+)\] (.+)/i);

					params.push(`-f${file}`);
					params.push(text_trimmed);
				} else {
					params.push(text);
				}

				logger.info('RxBot Fun - COWSAY ' + params.join(' '));

				let cowsay = spawn('cowsay', params);

				cowsay.stderr.on('data', data => client.tell(nick, data, ' '));
				cowsay.stdout.on('data', data => client.tell(nick, data, ' '));
			}
		});

		fortune$.subscribe(message => {
			logger.info('RxBot Fun - FORTUNE');

			let nick = message.args[0];

			let fortune = spawn('fortune');

			fortune.stderr.on('data', data => client.tell(nick, data, ' '));
			fortune.stdout.on('data', data => client.tell(nick, data, ' '));
		});

		fortunesay$.subscribe(message => {
			logger.info('RxBot Fun - FORTUNESAY');

			let nick = message.args[0];

			let fortune = spawn('fortune');
			let cowsay = spawn('cowsay');

			fortune.stdout.on('data', data => {
				cowsay.stdin.write(data);
			});

			fortune.stderr.on('data', data => client.tell(nick, data, ' '));

			fortune.on('close', (code) => {
				if (code !== 0) {
					logger.error(`RxBot Fun - FORTUNESAY fortune exited with code ${code}`);
				}
				cowsay.stdin.end();
			});

			cowsay.stdout.on('data', data => client.tell(nick, data, ' '));
			cowsay.stderr.on('data', data => client.tell(nick, data, ' '));

			cowsay.on('close', (code) => {
				if (code !== 0) {
					logger.error(`RxBot Fun - FORTUNESAY cowsay exited with code ${code}`);
				}
			});
		});

		roll$.subscribe(message => {
			let nick = message.args[0];
			let dices = Number(message.args[1].substring(6).trim()) || 2;

			let rolls = Array.from({ length: dices })
				.map(() => Math.ceil(Math.random() * 6))
				.map(number => `[${number}]`)
				.join(' ');

			logger.info(`Rxot Fun - ROLL ${rolls}`);

			client.tell(nick, rolls);
		});
	}
};
