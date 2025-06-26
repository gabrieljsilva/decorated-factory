type PathDepth = 3;
type Join<K, P> = K extends string | number ? (P extends string | number ? `${K}.${P}` : never) : never;
type NonFunctionKeys<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type Paths<T, Depth extends number = PathDepth> = [Depth] extends [never] ? never : T extends object ? {
    [K in NonFunctionKeys<T>]: K extends string | number ? T[K] extends (infer R)[] ? R extends object ? K | Join<K, Paths<R, Prev[Depth]>> : K : T[K] extends object ? K | Join<K, Paths<T[K], Prev[Depth]>> : K : never;
}[NonFunctionKeys<T>] : "";
type Prev = [never, 0, 1, 2, 3];
export type ArrayPaths<T, Depth extends number = 3> = [Depth] extends [never] ? never : T extends object ? {
    [K in keyof T & (string | number)]: T[K] extends (infer R)[] ? `${K}` | `${K}.${ArrayPaths<R, Prev[Depth]>}` : T[K] extends object ? `${K}.${ArrayPaths<T[K], Prev[Depth]>}` : never;
}[keyof T & (string | number)] : never;
export {};
