import "reflect-metadata";
import type { Faker } from "@interfaces/faker";
type FactoryFieldValueFn = (faker: Faker) => any;
export interface FactoryFieldMetadata {
    property: string;
    getValueFN: FactoryFieldValueFn;
}
export declare function FactoryField(getValueFn: FactoryFieldValueFn): (target: NonNullable<any>, propertyKey: string) => void;
export {};
