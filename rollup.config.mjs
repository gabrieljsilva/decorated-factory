import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
	input: "src/index.ts",
	output: [
		{
			file: "dist/index.cjs.js",
			format: "cjs",
			sourcemap: true,
			globals: {
				'reflect-metadata': 'Reflect'
			}
		},
		{
			file: "dist/index.esm.js",
			format: "es",
			sourcemap: true,
			globals: {
				'reflect-metadata': 'Reflect'
			}
		},
	],
	external: ['reflect-metadata'],
	plugins: [
		resolve(),
		commonjs(),
		typescript({
			tsconfig: "./tsconfig.json",
			exclude: ["**/*.test.ts", "**/*.spec.ts"],
		}),
	],
};
