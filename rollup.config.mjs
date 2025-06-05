import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
	input: "src/index.ts",
	output: [
		{
			file: "dist/index.cjs.js",
			format: "cjs",
			sourcemap: false,
			globals: {
				'reflect-metadata': 'Reflect',
				'@faker-js/faker': 'faker'
			}
		},
		{
			file: "dist/index.esm.js",
			format: "es",
			sourcemap: false,
			globals: {
				'reflect-metadata': 'Reflect',
				'@faker-js/faker': 'faker'
			}
		},
	],
	external: ['reflect-metadata', '@faker-js/faker'],
	plugins: [
		resolve(),
		commonjs(),
		typescript({
			tsconfig: "./tsconfig.json",
			exclude: ["**/*.test.ts", "**/*.spec.ts"],
		}),
	],
};
