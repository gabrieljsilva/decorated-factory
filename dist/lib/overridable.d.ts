import { DeepPartial } from "src/interfaces";
export declare class Overridable<T> {
    private readonly instance;
    constructor(instance: T);
    override(override: (instance: T) => DeepPartial<T>): T;
    getInstance(): T;
    private deepMerge;
    private mergeArray;
}
