export type Plain<T> = T extends Array<infer U> ? Plain<U>[] : T extends object ? { [K in keyof T]: Plain<T[K]> } : T;
