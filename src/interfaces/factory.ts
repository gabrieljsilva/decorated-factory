import type { Faker } from "@faker-js/faker";
import type { Type } from "./type";

/**
 * Options for building an entity instance.
 */
export interface BuildOpts<T> {
	/**
	 * Faker instance to use for generating random values.
	 */
	faker: Faker;
	
	/**
	 * Entity constructor type.
	 */
	entity: Type<T>;
	
	/**
	 * Whether to create a plain object instead of an instance.
	 * @default false
	 */
	plain?: boolean;
}