import type { Faker } from "@faker-js/faker";
import type { Type } from "../interfaces";
import { AutoIncrement, UUID } from "../lib";

/**
 * Map of built-in JavaScript types to functions that generate appropriate values using Faker.
 * This allows the FactoryType decorator to work with built-in types without requiring explicit value declarations.
 */
export const BUILT_IN_TYPES = new Map<Type<any>, (faker: Faker) => any>([
	[String, (faker: Faker) => faker.lorem.word({ length: { min: 6, max: 12 } })],
	[Number, (faker: Faker) => faker.number.int({ min: 1, max: 10000 })],
	[Boolean, (faker: Faker) => faker.datatype.boolean()],
	[Date, (faker: Faker) => faker.date.past()],
	[UUID, (faker: Faker) => faker.string.uuid()],
	[AutoIncrement, () => 0],
]);
