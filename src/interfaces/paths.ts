type PathDepth = 3;
type Join<K, P> = K extends string | number ? (P extends string | number ? `${K}.${P}` : never) : never;
type NonFunctionKeys<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/**
 * Creates a string union of all possible paths in an object, including nested objects and arrays.
 *
 * @remarks
 * TypeScript has a limited amount of recursion, so the depth is limited to 3 by default.
 * It can be increased by changing the PathDepth type, but it will increase the compilation time.
 */
export type Paths<T, Depth extends number = PathDepth> = [Depth] extends [never]
	? never
	: T extends object
		? {
				[K in NonFunctionKeys<T>]: K extends string | number
					? // ---------- ARRAY ----------
						T[K] extends (infer R)[]
						? R extends object
							? /* array de objetos */ K | Join<K, Paths<R, Prev[Depth]>>
							: /* array de primitivos */ K
						: // --------- OBJETO ---------
							T[K] extends object
							? K | Join<K, Paths<T[K], Prev[Depth]>>
							: // ------ ESCALAR ---------
								K
					: never;
			}[NonFunctionKeys<T>]
		: "";

/**
 * Helper to compute the previous depth for recursive mapped types.
 * Depth is limited to 3 as in the original Paths<T>.
 */
type Prev = [never, 0, 1, 2, 3];

/**
 * Produces a union with every path that points to an array property (primitive
 * or object array) inside T, including nested ones. Root-level array
 * properties are included by their own key (e.g. "photos").
 */
export type ArrayPaths<T, Depth extends number = 3> = [Depth] extends [never]
	? never
	: T extends object
		? {
				[K in keyof T & (string | number)]: T[K] extends (infer R)[]
					? `${K}` | `${K}.${ArrayPaths<R, Prev[Depth]>}`
					: T[K] extends object
						? `${K}.${ArrayPaths<T[K], Prev[Depth]>}`
						: never;
			}[keyof T & (string | number)]
		: never;
