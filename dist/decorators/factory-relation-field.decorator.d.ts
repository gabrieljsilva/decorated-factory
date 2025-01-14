import type { Paths } from "src/interfaces/paths";
import type { Type } from "../interfaces";
export interface RelationKeyBinding<Parent, Child> {
    key: Paths<Parent>;
    inverseField: Paths<Child>;
}
export interface FactoryRelationMetadata {
    property: string;
    returnTypeFn: () => Type | [Type];
    keyBinding?: RelationKeyBinding<any, any>;
}
export declare function FactoryRelationField<Parent, Child>(returnValueFN: () => Type<Child> | [Type<Child>], keyBinding?: RelationKeyBinding<Parent, Child>): (target: NonNullable<any>, propertyKey: string) => void;
