import type { Faker } from "@faker-js/faker";
import type { DeepPartial, Select, Type } from "../interfaces";
import { Overridable } from "./overridable";
export declare class Factory {
    private readonly faker;
    constructor(fakerInstance: Faker);
    create<T>(entity: Type<T>, select?: Select<T>): Overridable<T>;
    createList<T>(entity: Type<T>, amount: number, select?: Select<T>): Overridable<T[]>;
    new<T = any>(entity: Type<T>, select?: Select<T>): T;
    newList<T = any>(entity: Type<T>, amount: number, select?: Select<T>): Array<T>;
    partial<T = any>(entity: Type<T>, select: Select<T>): DeepPartial<T>;
    private applyRelations;
    private applyKeyBinding;
    private bindNestedRelations;
    private createInstance;
    private createPartialInstance;
    private applyPartialRelations;
}
