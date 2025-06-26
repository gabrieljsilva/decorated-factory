import type { Faker } from "@faker-js/faker";
type FactoryFieldValueFn = (faker: Faker) => any;
export interface FactoryFieldOptions {
    isArray?: boolean;
}
export interface FactoryValueMetadata {
    property: string;
    getValueFN: FactoryFieldValueFn;
    isArray?: boolean;
}
export declare function FactoryValue(getValueFn: FactoryFieldValueFn, options?: FactoryFieldOptions): (target: NonNullable<any>, propertyKey: string) => void;
export {};
