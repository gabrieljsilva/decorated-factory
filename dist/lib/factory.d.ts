import type { Faker } from "@faker-js/faker";
import type { DeepPartial, Select, Type } from "../interfaces";
import { Overridable } from "./overridable";
export declare class OneFactory<T> {
    private readonly factory;
    private readonly entity;
    private readonly select?;
    private overrideFn?;
    private partialSelect?;
    constructor(factory: Factory, entity: Type<T>, select?: Select<T>);
    override(overrideFn: (instance: T) => DeepPartial<T>): OneFactory<T>;
    partial(select: Select<T>): OneFactory<T>;
    make(): T;
    build(): T;
}
export declare class ManyFactory<T> {
    private readonly factory;
    private readonly entity;
    private readonly amount;
    private readonly select?;
    private overrideFn?;
    private partialSelect?;
    constructor(factory: Factory, entity: Type<T>, amount: number, select?: Select<T>);
    override(overrideFn: (instances: T[]) => DeepPartial<T>[]): ManyFactory<T>;
    partial(select: Select<T>): ManyFactory<T>;
    make(): T[];
    build(): T[];
}
export declare class Factory {
    private readonly faker;
    constructor(fakerInstance: Faker);
    one<T>(entity: Type<T>, select?: Select<T>): OneFactory<T>;
    many<T>(entity: Type<T>, amount: number, select?: Select<T>): ManyFactory<T>;
    create<T>(entity: Type<T>, select?: Select<T>): Overridable<T>;
    createList<T>(entity: Type<T>, amount: number, select?: Select<T>): Overridable<T[]>;
    new<T = any>(entity: Type<T>, select?: Select<T>): T;
    newList<T = any>(entity: Type<T>, amount: number, select?: Select<T>): Array<T>;
    partial<T = any>(entity: Type<T>, select: Select<T>): DeepPartial<T>;
    private applyEntityRelations;
    private applyRelations;
    private applyKeyBinding;
    private bindNestedRelations;
    private createEntityInstance;
    private createInstance;
    private createPartialInstance;
    private applyPartialRelations;
}
