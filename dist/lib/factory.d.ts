import type { Faker } from "@faker-js/faker";
import type { ArrayPaths, BuildOpts, Paths, Type } from "../interfaces";
import { Plain } from "../interfaces/plain";
declare class EntityBuilder<T, M extends boolean = false> {
    private readonly faker;
    private readonly entityType;
    private readonly relations;
    private readonly exclusions;
    private readonly overrides;
    private readonly globalAutoCounters;
    private readonly localAutoCounters;
    private currentRoot;
    private asPlain;
    constructor({ faker, entity, plain }: BuildOpts<T>);
    with<P extends Paths<T>>(path: P): this;
    with<P extends ArrayPaths<T>>(amount: number, path: P): this;
    without<P extends Paths<T>>(path: P): this;
    set<P extends Paths<T>>(path: P, value: any): this;
    make(size?: M extends true ? number : never): M extends true ? T[] : T;
    plain(size?: M extends true ? number : never): M extends true ? Plain<T>[] : Plain<T>;
    private spawnRoot;
    private spawnChild;
    private hasRelation;
    private populate;
    private bindKeys;
    private readFieldMeta;
    private readRelationMeta;
    private generateAutoIncrement;
}
export declare class Factory {
    private readonly fake;
    constructor(faker: Faker);
    one<T>(entity: Type<T>): EntityBuilder<T, false>;
    many<T>(entity: Type<T>): EntityBuilder<T, true>;
}
export {};
