import {keyExchangeMachine} from './machines.js';
import {interpret} from 'xstate';

const service = interpret(keyExchangeMachine);
service.start();
service.onTransition((...args) => {
	console.log(...args);
});

document.querySelector('#connect').addEventListener('click', () => {
	service.send('BEGIN_CONNECTION');
});
