import type { Type } from "../interfaces";
export interface FactoryRelationMetadata {
    property: string;
    returnTypeFn: () => Type | [Type];
}
export declare function FactoryRelationField<T = any>(returnValueFN: () => Type<T> | [Type<T>]): (target: NonNullable<any>, propertyKey: string) => void;
