const express = require('express');
const router = express.Router();
const {Machine, assign, interpret} = require('xstate');
const crypto = require('crypto');

const keyExchangeMachine = new Machine(
	{
		id: 'key-exchange',
		initial: 'disconnected',
		context: {
			dh: null,
			publicKey: null,
			secretKey: null,
			iv: null,
			cipher: null,
			decipher: null,
		},
		states: {
			disconnected: {
				entry: ['createDiffieHellman', 'generatePublicKey', 'generateIV'],
				on: {
					CONNECT: {
						target: 'establishing',
					},
				},
			},
			establishing: {
				on: {
					RECEIVED_KEYS: {
						target: 'connected',
						actions: ['generateSecretKey', 'createCipherAndDecipher'],
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
			createDiffieHellman: assign({dh: () => crypto.createDiffieHellman(256)}),
			generatePublicKey: assign({publicKey: ({dh}) => dh.generateKeys()}),
			generateIV: assign({iv: crypto.randomBytes(16)}),
			generateSecretKey: assign({
				secretKey: ({dh}, {publicKey}) => dh.computeSecret(publicKey),
			}),
			createCipherAndDecipher: assign({
				cipher: ({secretKey, iv}) =>
					crypto.createCipheriv('aes-256-cbc', secretKey, iv),
				decipher: ({secretKey, iv}) =>
					crypto.createDecipheriv('aes-256-cbc', secretKey, iv),
			}),
		},
	},
);

const connections = {};
router.get('/', (req, res) => {
	const service = interpret(keyExchangeMachine);
	connections[req.ip] = service;

	service.start();
	service.send('CONNECTING');

	const ctx = service.state.context;
	res.json({
		status: service.state.value,
		publicKey: ctx.publicKey,
		iv: ctx.iv,
		prime: ctx.dh.getPrime(),
		generator: ctx.dh.getGenerator(),
	});
});

router.put('/', (req, res) => {
	const service = connections[req.ip];
	const {publicKey} = req.body;

	if (!service)
		res
			.status(422)
			.json({error: 'Previous connection step needs to be done first.'});
	if (!publicKey) res.status(422).json({error: "Missing data 'publicKey'"});

	service.send('RECEIVED_KEYS', {publicKey});

	res.json({
		status: service.state.value,
	});
});

module.exports = router;
