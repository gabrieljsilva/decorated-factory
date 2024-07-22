import { FACTORY_RELATION } from "../constants";
import type { Type } from "../interfaces";
import { extendArrayMetadata } from "../utils";

export interface FactoryRelationMetadata {
	property: string;
	returnTypeFn: () => Type | [Type];
}

export function FactoryRelationField<T = any>(
	returnValueFN: () => Type<T> | [Type<T>],
) {
	return (target: NonNullable<any>, propertyKey: string) => {
		const factoryRelationMetadata: FactoryRelationMetadata = {
			property: propertyKey,
			returnTypeFn: returnValueFN,
		};

		extendArrayMetadata(
			FACTORY_RELATION,
			[factoryRelationMetadata],
			target.constructor,
		);
	};
}
