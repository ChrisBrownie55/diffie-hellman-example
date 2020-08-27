const chalk = require('chalk');

function createNamespace(namespace) {
	let lastLogTime = null;
	return function log(...messages) {
		const now = Date.now();
		let timeDiff;

		if (lastLogTime === null) timeDiff = 0;
		else timeDiff = now - lastLogTime;

		lastLogTime = now;

		console.log(
			chalk`{blue.bold [${namespace}]} ${messages.join(
				' ',
			)} {blue +${timeDiff}ms}`,
		);
	};
}

module.exports.createNamespace = createNamespace;
