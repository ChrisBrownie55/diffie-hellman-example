import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
	input: 'public/javascripts/main.js',
	output: {
		file: 'public/javascripts/bundle.js',
		format: 'esm'
	},
	plugins: [
		commonjs(),
		resolve(),
		json(),
	],
};
