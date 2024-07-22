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
		},
		{
			file: "dist/index.esm.js",
			format: "es",
			sourcemap: true,
		},
	],
	plugins: [
		resolve(),
		commonjs(),
		typescript({
			exclude: ["**/*.test.ts", "**/*.spec.ts"],
		}),
	],
};
