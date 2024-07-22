export type Select<T> = {
    [K in keyof T]?: T[K] extends Array<infer U> ? [number, Select<U>?] : T[K] extends object ? Select<T[K]> | true : boolean;
};
