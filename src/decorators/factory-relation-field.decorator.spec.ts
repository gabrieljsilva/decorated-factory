import "reflect-metadata";
import { faker } from "@faker-js/faker";
import { Factory } from "src/lib";
import { FACTORY_RELATION } from "../constants";
import { FactoryField, FactoryRelationField } from "../decorators";

describe("FactoryRelationField", () => {
	it("should correctly store metadata in FACTORY_RELATION", () => {
		class Review {
			@FactoryField((faker) => faker.number.int())
			id: number;
		}

		class Product {
			@FactoryRelationField(() => Review)
			review: Review;
		}

		const metadata = Reflect.getMetadata(FACTORY_RELATION, Product);
		expect(metadata).toHaveLength(1);
		expect(metadata[0].property).toBe("review");
		expect(metadata[0].returnTypeFn()).toBe(Review);
	});

	it("should resolve returnTypeFn to the provided type or array of types", () => {
		class Skill {
			@FactoryField((faker) => faker.number.int())
			id: number;
		}

		class Employee {
			@FactoryRelationField(() => Skill)
			skill: Skill;
		}

		class Team {
			@FactoryRelationField(() => [Skill])
			skills: Skill[];
		}

		const singleMetadata = Reflect.getMetadata(FACTORY_RELATION, Employee)[0];
		const arrayMetadata = Reflect.getMetadata(FACTORY_RELATION, Team)[0];

		expect(singleMetadata.returnTypeFn()).toBe(Skill);
		expect(Array.isArray(arrayMetadata.returnTypeFn())).toBe(true);
		expect(arrayMetadata.returnTypeFn()[0]).toBe(Skill);
	});

	it("should correctly bind Manager.id to Team.managerId", () => {
		class Team {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.number.int())
			managerId: number;
		}

		class Manager {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryRelationField(() => Team, {
				key: "id",
				inverseKey: "managerId",
			})
			team: Team;
		}

		const factory = new Factory(faker);
		const manager = factory.new(Manager, { team: true });

		expect(manager.team.managerId).toBe(manager.id);
	});

	it("should store and retrieve keyBinding in the metadata", () => {
		class Chapter {
			@FactoryField((faker) => faker.number.int())
			bookId: number;
		}

		class Book {
			@FactoryRelationField(() => Chapter, {
				key: "id",
				inverseKey: "bookId",
			})
			chapter: Chapter;
		}

		const metadata = Reflect.getMetadata(FACTORY_RELATION, Book)[0];
		expect(metadata.keyBinding).toBeDefined();
		expect(metadata.keyBinding.key).toBe("id");
		expect(metadata.keyBinding.inverseKey).toBe("bookId");
	});

	it("should generate a related entity for a single entity relationship", () => {
		class Address {
			@FactoryField((faker) => faker.number.int())
			id: number;
		}

		class Customer {
			@FactoryRelationField(() => Address)
			address: Address;
		}

		const factory = new Factory(faker);
		const customer = factory.new(Customer, { address: true });

		expect(customer.address).toBeInstanceOf(Address);
		expect(typeof customer.address.id).toBe("number");
	});

	it("should generate an array of related entities for an array relationship", () => {
		class Order {
			@FactoryField((faker) => faker.number.int())
			id: number;
		}

		class Cart {
			@FactoryRelationField(() => [Order])
			orders: Order[];
		}

		const factory = new Factory(faker);
		const cart = factory.new(Cart, { orders: [3] });

		expect(Array.isArray(cart.orders)).toBe(true);
		expect(cart.orders).toHaveLength(3);
		for (const order of cart.orders) {
			expect(order).toBeInstanceOf(Order);
			expect(typeof order.id).toBe("number");
		}
	});

	it("should allow overriding fields with relationships defined", () => {
		class Feedback {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.string.sample())
			content: string;
		}

		class Survey {
			@FactoryRelationField(() => Feedback)
			feedback: Feedback;
		}

		const factory = new Factory(faker);
		const survey = factory.create(Survey, { feedback: true }).override(() => ({
			feedback: { content: "Custom Feedback" },
		}));

		expect(survey.feedback.content).toBe("Custom Feedback");
		expect(typeof survey.feedback.id).toBe("number");
	});

	it("should persist overridden fields after generation", () => {
		class Ticket {
			@FactoryField((faker) => faker.number.int())
			id: number;
		}

		class Event {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryRelationField(() => [Ticket])
			tickets: Ticket[];
		}

		const factory = new Factory(faker);
		const customId = 1234;
		const event = factory.create(Event, { tickets: [2] }).override(() => ({
			id: customId,
			tickets: [{ id: customId + 1 }],
		}));

		expect(event.id).toBe(customId);
		expect(event.tickets[0].id).toBe(customId + 1);
	});
});
