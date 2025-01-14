import type { Paths } from "src/interfaces/paths";
import { FACTORY_RELATION } from "../constants";
import type { Type } from "../interfaces";
import { extendArrayMetadata } from "../utils";

export interface RelationKeyBinding<Parent, Child> {
	key: Paths<Parent>;
	inverseField: Paths<Child>;
}

export interface FactoryRelationMetadata {
	property: string;
	returnTypeFn: () => Type | [Type];
	keyBinding?: RelationKeyBinding<any, any>;
}

export function FactoryRelationField<Parent, Child>(
	returnValueFN: () => Type<Child> | [Type<Child>],
	keyBinding?: RelationKeyBinding<Parent, Child>,
) {
	return (target: NonNullable<any>, propertyKey: string) => {
		const factoryRelationMetadata: FactoryRelationMetadata = {
			property: propertyKey,
			returnTypeFn: returnValueFN,
			keyBinding,
		};

		extendArrayMetadata(FACTORY_RELATION, [factoryRelationMetadata], target.constructor);
	};
}
