import "reflect-metadata";
import { faker } from "@faker-js/faker";
import { Factory } from "src/lib";
import { BUILT_IN_TYPES, FACTORY_TYPE } from "../constants";
import { FactoryType, FactoryValue } from "../decorators";

describe("FactoryRelationField", () => {
	it("should correctly store metadata in FACTORY_RELATION", () => {
		class Review {
			@FactoryValue((faker) => faker.number.int())
			id: number;
		}

		class Product {
			@FactoryType(() => Review)
			review: Review;
		}

		const metadata = Reflect.getMetadata(FACTORY_TYPE, Product);
		expect(metadata).toHaveLength(1);
		expect(metadata[0].property).toBe("review");
		expect(metadata[0].returnTypeFn()).toBe(Review);
	});

	it("should resolve returnTypeFn to the provided type or array of types", () => {
		class Skill {
			@FactoryValue((faker) => faker.number.int())
			id: number;
		}

		class Employee {
			@FactoryType(() => Skill)
			skill: Skill;
		}

		class Team {
			@FactoryType(() => [Skill])
			skills: Skill[];
		}

		const singleMetadata = Reflect.getMetadata(FACTORY_TYPE, Employee)[0];
		const arrayMetadata = Reflect.getMetadata(FACTORY_TYPE, Team)[0];

		expect(singleMetadata.returnTypeFn()).toBe(Skill);
		expect(Array.isArray(arrayMetadata.returnTypeFn())).toBe(true);
		expect(arrayMetadata.returnTypeFn()[0]).toBe(Skill);
	});

	it("should correctly bind Manager.id to Team.managerId", () => {
		class Team {
			@FactoryValue((faker) => faker.number.int())
			id: number;

			@FactoryValue((faker) => faker.number.int())
			managerId: number;
		}

		class Manager {
			@FactoryValue((faker) => faker.number.int())
			id: number;

			@FactoryType(() => Team, { key: "id", inverseKey: "managerId" })
			team: Team;
		}

		const factory = new Factory(faker);
		const manager = factory.one(Manager).with("team").make();

		expect(manager.team.managerId).toBe(manager.id);
	});

	it("should store and retrieve keyBinding in the metadata", () => {
		class Chapter {
			@FactoryValue((faker) => faker.number.int())
			bookId: number;
		}

		class Book {
			@FactoryType(() => Chapter, {
				key: "id",
				inverseKey: "bookId",
			})
			chapter: Chapter;
		}

		const metadata = Reflect.getMetadata(FACTORY_TYPE, Book)[0];
		expect(metadata.keyBinding).toBeDefined();
		expect(metadata.keyBinding.key).toBe("id");
		expect(metadata.keyBinding.inverseKey).toBe("bookId");
	});

	it("should generate a related entity for a single entity relationship", () => {
		class Address {
			@FactoryValue((faker) => faker.number.int())
			id: number;
		}

		class Customer {
			@FactoryType(() => Address)
			address: Address;
		}

		const factory = new Factory(faker);
		const customer = factory.one(Customer).with("address").make();

		expect(customer.address).toBeInstanceOf(Address);
		expect(typeof customer.address.id).toBe("number");
	});

	it("should generate an array of related entities for an array relationship", () => {
		class Order {
			@FactoryValue((faker) => faker.number.int())
			id: number;
		}

		class Cart {
			@FactoryType(() => [Order])
			orders: Order[];
		}

		const factory = new Factory(faker);
		const cart = factory.one(Cart).with(3, "orders").make();

		expect(Array.isArray(cart.orders)).toBe(true);
		expect(cart.orders).toHaveLength(3);
		for (const order of cart.orders) {
			expect(order).toBeInstanceOf(Order);
			expect(typeof order.id).toBe("number");
		}
	});

	it("should allow overriding fields with relationships defined", () => {
		class Feedback {
			@FactoryValue((faker) => faker.number.int())
			id: number;

			@FactoryValue((faker) => faker.string.sample())
			content: string;
		}

		class Survey {
			@FactoryType(() => Feedback)
			feedback: Feedback;
		}

		const factory = new Factory(faker);
		const survey = factory.one(Survey).with("feedback").set("feedback.content", "Custom Feedback").make();

		expect(survey.feedback.content).toBe("Custom Feedback");
		expect(typeof survey.feedback.id).toBe("number");
	});
});

describe("FactoryType with built-in types", () => {
	it("should work with String built-in type", () => {
		class Document {
			@FactoryType(() => String)
			content: string;
		}

		const factory = new Factory(faker);
		const document = factory.one(Document).with("content").make();

		expect(typeof document.content).toBe("string");
		expect(document.content.length).toBeGreaterThanOrEqual(6);
		expect(document.content.length).toBeLessThanOrEqual(12);
	});

	it("should work with Number built-in type", () => {
		class Counter {
			@FactoryType(() => Number)
			value: number;
		}

		const factory = new Factory(faker);
		const counter = factory.one(Counter).with("value").make();

		expect(typeof counter.value).toBe("number");
		expect(counter.value).toBeGreaterThanOrEqual(1);
		expect(counter.value).toBeLessThanOrEqual(10000);
	});

	it("should work with Boolean built-in type", () => {
		class Setting {
			@FactoryType(() => Boolean)
			enabled: boolean;
		}

		const factory = new Factory(faker);
		const setting = factory.one(Setting).with("enabled").make();

		expect(typeof setting.enabled).toBe("boolean");
	});

	it("should work with Date built-in type", () => {
		class Event {
			@FactoryType(() => Date)
			timestamp: Date;
		}

		const factory = new Factory(faker);
		const event = factory.one(Event).with("timestamp").make();

		expect(event.timestamp).toBeInstanceOf(Date);
	});

	it("should work with arrays of built-in types", () => {
		class Collection {
			@FactoryType(() => [String])
			names: string[];

			@FactoryType(() => [Number])
			values: number[];

			@FactoryType(() => [Boolean])
			flags: boolean[];

			@FactoryType(() => [Date])
			dates: Date[];
		}

		const factory = new Factory(faker);
		const collection = factory
			.one(Collection)
			.with(3, "names")
			.with(3, "values")
			.with(3, "flags")
			.with(3, "dates")
			.make();

		expect(Array.isArray(collection.names)).toBe(true);
		expect(collection.names).toHaveLength(3);
		for (const name of collection.names) {
			expect(typeof name).toBe("string");
		}

		expect(Array.isArray(collection.values)).toBe(true);
		expect(collection.values).toHaveLength(3);
		for (const value of collection.values) {
			expect(typeof value).toBe("number");
		}

		expect(Array.isArray(collection.flags)).toBe(true);
		expect(collection.flags).toHaveLength(3);
		for (const flag of collection.flags) {
			expect(typeof flag).toBe("boolean");
		}

		expect(Array.isArray(collection.dates)).toBe(true);
		expect(collection.dates).toHaveLength(3);
		for (const date of collection.dates) {
			expect(date).toBeInstanceOf(Date);
		}
	});
});
