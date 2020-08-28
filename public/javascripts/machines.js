import ky from 'ky';
import {Machine, assign} from 'xstate';
import {DiffieHellman} from 'diffie-hellman/browser';

function establishConnection() {
	return ky.get('/establish-connection').json();
}
async function finishConnection({publicKey}) {
	return ky.put('/establish-connection', {json: {publicKey}}).json();
}

function generateCryptoKey({secretKey}) {
	return crypto.subtle.importKey(
		'raw',
		new Uint8Array(secretKey).buffer,
		'AES-CBC',
		false,
		['encrypt', 'decrypt'],
	);
}

export const keyExchangeMachine = Machine(
	{
		id: 'key-exchange',
		initial: 'disconnected',
		context: {
			dh: null,
			publicKey: null,
			privateKey: null,
			iv: null,
			cipher: null,
			decipher: null,
		},
		states: {
			disconnected: {
				on: {
					BEGIN_CONNECTION: 'establishing',
				},
			},
			establishing: {
				invoke: {
					src: establishConnection,
					onDone: {
						target: 'finishingConnection',
						actions: [
							'createDiffieHellman',
							'generateKeys',
							'setIV',
							'generateSecretKey',
						],
					},
				},
			},
			finishingConnection: {
				invoke: {
					src: finishConnection,
					onDone: {
						target: 'generatingCryptoKey',
					},
				},
			},
			generatingCryptoKey: {
				invoke: {
					src: generateCryptoKey,
					onDone: {
						target: 'connected',
						actions: ['setCryptoKey'],
					},
				},
			},
			connected: {
				type: 'final',
			},
		},
	},
	{
		actions: {
			createDiffieHellman: assign({
				dh: (ctx, {prime, generator}) => new DiffieHellman(prime, generator),
			}),
			generateKeys: assign({publicKey: ({dh}) => dh.generateKeys()}),
			generateSecretKey: assign({
				secretKey: ({dh}, {publicKey}) => dh.computeSecretKey(publicKey),
			}),
			setIV: assign({iv: (ctx, {iv}) => iv}),
			setCryptoKey: assign({cryptoKey: (ctx, {cryptoKey}) => cryptoKey}),
		},
	},
);
