import type { Faker } from "@faker-js/faker";
import type { Select } from "@interfaces/select";
import type { Type } from "@interfaces/type";
import { Overridable } from "@lib/overridable";
export declare class Factory {
    private readonly faker;
    constructor(fakerInstance: Faker);
    create<T>(entity: Type<T>, select?: Select<T>): Overridable<T>;
    createList<T>(entity: Type<T>, amount: number, select?: Select<T>): Overridable<T[]>;
    new<T = any>(entity: Type<T>, select?: Select<T>): T;
    newList<T = any>(entity: Type<T>, amount: number, select?: Select<T>): Array<T>;
    private applyRelations;
    private createInstance;
}
