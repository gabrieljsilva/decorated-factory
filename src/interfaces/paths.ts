// src/types/paths.ts
type PathDepth = 3;
type Prev = [never, 0, 1, 2, 3];
type Depth = Prev[PathDepth];

type Join<K extends string | number, P extends string | number> = `${K}.${P}`;

type NonFunctionKeys<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export type Paths<T, D extends number = PathDepth> = [D] extends [never]
	? never
	: T extends object
		? {
				[K in NonFunctionKeys<T>]: K extends string | number
					? T[K] extends (infer R)[]
						? K | Join<K, Paths<R, Prev[D]>>
						: T[K] extends object
							? K | Join<K, Paths<T[K], Prev[D]>>
							: K
					: never;
			}[NonFunctionKeys<T>]
		: "";
