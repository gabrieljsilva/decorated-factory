import type { Faker } from "@faker-js/faker";
type FactoryFieldValueFn = (faker: Faker) => any;
export interface FactoryFieldMetadata {
    property: string;
    getValueFN: FactoryFieldValueFn;
}
export declare function FactoryField(getValueFn: FactoryFieldValueFn): (target: NonNullable<any>, propertyKey: string) => void;
export {};
