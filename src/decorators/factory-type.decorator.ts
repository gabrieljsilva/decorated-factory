import type { Paths } from "src/interfaces/paths";
import { FACTORY_TYPE } from "../constants";
import type { Type } from "../interfaces";
import { extendArrayMetadata } from "../utils";

export interface RelationKeyBinding<Parent, Child> {
	key: Paths<Parent>;
	inverseKey: Paths<Child>;
}

export interface FactoryTypeMetadata {
	property: string;
	returnTypeFn: () => Type | [Type];
	keyBinding?: RelationKeyBinding<any, any>;
}

export function FactoryType<Parent, Child>(
	returnValueFN: () => Type<Child> | [Type<Child>],
	keyBinding?: RelationKeyBinding<Parent, Child>,
) {
	return (target: NonNullable<any>, propertyKey: string) => {
		const factoryRelationMetadata: FactoryTypeMetadata = {
			property: propertyKey,
			returnTypeFn: returnValueFN,
			keyBinding,
		};

		extendArrayMetadata(FACTORY_TYPE, [factoryRelationMetadata], target.constructor);
	};
}
