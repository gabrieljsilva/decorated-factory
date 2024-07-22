import { FACTORY_RELATION } from "@constants/metadata-keys.constants";
import type { Type } from "@interfaces/type";
import { extendArrayMetadata } from "src/utils";

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
