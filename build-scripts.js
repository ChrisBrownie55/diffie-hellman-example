const loadConfigFile = require('rollup/dist/loadConfigFile');
const path = require('path');
const rollup = require('rollup');
const log = require('./debug').createNamespace('rollup')

// load the config file next to the current script;
// the provided config object has the same effect as passing "--format es"
// on the command line and will override the format of all outputs
loadConfigFile(path.resolve(__dirname, 'rollup.config.js'), {})
	.then(({options: allOptions, warnings}) => {
		allOptions.map(async options => {
			// "warnings" wraps the default `onwarn` handler passed by the CLI.
			// This prints all warnings up to this point:
			console.log(`We currently have ${warnings.count} warnings`);

			// This prints all deferred warnings
			warnings.flush();

			// options is an "inputOptions" object with an additional "output"
			// property that contains an array of "outputOptions".
			// The following will generate all outputs and write them to disk the same
			// way the CLI does it:
			const bundle = await rollup.rollup(options);
			await Promise.all(options.output.map(bundle.write));

			// You can also pass this directly to "rollup.watch"
			const watcher = rollup.watch(options);

			watcher.on('START', () => log('files changed, bundling...'))
		});
	});
