import type { Faker } from "@faker-js/faker";
import { FACTORY_VALUE } from "../constants";
import { extendArrayMetadata } from "../utils";

type FactoryFieldValueFn = (faker: Faker) => any;

export interface FactoryFieldOptions {
	isArray?: boolean;
}

export interface FactoryValueMetadata {
	property: string;
	getValueFN: FactoryFieldValueFn;
	isArray?: boolean;
}

export function FactoryValue(getValueFn: FactoryFieldValueFn, options?: FactoryFieldOptions) {
	return (target: NonNullable<any>, propertyKey: string) => {
		const metadata: FactoryValueMetadata = {
			property: propertyKey,
			getValueFN: getValueFn,
			isArray: options?.isArray,
		};

		extendArrayMetadata(FACTORY_VALUE, [metadata], target.constructor);
	};
}
