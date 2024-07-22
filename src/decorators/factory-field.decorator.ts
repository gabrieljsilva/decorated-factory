import "reflect-metadata";
import { FACTORY_FIELD } from "@constants/metadata-keys.constants";
import type { Faker } from "@faker-js/faker";
import { extendArrayMetadata } from "@utils/extend-array-metadata";

type FactoryFieldValueFn = (faker: Faker) => any;

export interface FactoryFieldMetadata {
	property: string;
	getValueFN: FactoryFieldValueFn;
}

export function FactoryField(getValueFn: FactoryFieldValueFn) {
	return (target: NonNullable<any>, propertyKey: string) => {
		const metadata: FactoryFieldMetadata = {
			property: propertyKey,
			getValueFN: getValueFn,
		};

		extendArrayMetadata(FACTORY_FIELD, [metadata], target.constructor);
	};
}
