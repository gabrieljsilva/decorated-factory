import "reflect-metadata";
import { FactoryField } from "@decorators/factory-field.decorator";
import { FactoryRelationField } from "@decorators/factory-relation-field.decorator";
import { faker } from "@faker-js/faker";
import { Factory } from "src/lib/factory";
import { Overridable } from "src/lib/overridable";

describe("Factory tests", () => {
	it("should create an entity", () => {
		class DummyEntity {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);

		const dummyEntity = factory.new(DummyEntity);
		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(typeof dummyEntity.id).toBe("number");
		expect(typeof dummyEntity.name).toBe("string");
	});

	it("should create an entity with override", () => {
		const dummyEntityId = 1;
		class DummyEntity {
			@FactoryField(() => dummyEntityId)
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);
		const dummyEntity = factory
			.create(DummyEntity)
			.override(() => ({ name: "Hello World" }));

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(dummyEntity.name).toBe("Hello World");
		expect(dummyEntity.id).toBe(dummyEntityId);
	});

	it("should inject faker instance", () => {
		const factory = new Factory(faker);
		expect(factory).toHaveProperty("faker");
	});

	it("should create an entity with relation", () => {
		class DummyRelationEntity {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		class DummyEntity {
			@FactoryRelationField(() => DummyRelationEntity)
			field: DummyRelationEntity;
		}

		const factory = new Factory(faker);
		const dummyEntity = factory.new(DummyEntity, {
			field: true,
		});

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(dummyEntity.field).toBeInstanceOf(DummyRelationEntity);
	});

	it("should create an entity with relation array", () => {
		class DummyRelationEntity {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		class DummyEntity {
			@FactoryRelationField(() => [DummyRelationEntity])
			field: DummyRelationEntity[];
		}

		const factory = new Factory(faker);
		const dummyEntity = factory.new(DummyEntity, {
			field: [1],
		});

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(Array.isArray(dummyEntity.field)).toBeTruthy();
		expect(dummyEntity.field[0]).toBeInstanceOf(DummyRelationEntity);
	});

	it("should create an entity with relation array with override", () => {
		class DummyRelationEntity {
			@FactoryField((faker) => faker.number.int({ min: 999, max: 999999 }))
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		class DummyEntity {
			@FactoryRelationField(() => [DummyRelationEntity])
			field: DummyRelationEntity[];
		}

		const factory = new Factory(faker);
		const dummyEntity = factory
			.create(DummyEntity, {
				field: [1],
			})
			.override(() => ({
				field: [{ name: "Hello World" }],
			}));

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(Array.isArray(dummyEntity.field)).toBeTruthy();
		expect(dummyEntity.field[0]).toBeInstanceOf(DummyRelationEntity);
		expect(dummyEntity.field[0].name).toBe("Hello World");
	});

	it("should replace a value to null", () => {
		class DummyEntity {
			@FactoryField(() => 1)
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);

		const dummyEntity = factory.create(DummyEntity).override(() => ({
			name: null,
		}));

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(dummyEntity.name).toBeNull();
	});

	it("should create an entity with relation and replace relation value to null", () => {
		class DummyRelationEntity {
			@FactoryField((faker) => faker.number.int({ min: 999, max: 999999 }))
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		class DummyEntity {
			@FactoryRelationField(() => [DummyRelationEntity])
			field: DummyRelationEntity[];
		}

		const factory = new Factory(faker);
		const dummyEntity = factory
			.create(DummyEntity, {
				field: [1],
			})
			.override(() => ({
				field: [{ name: null }],
			}));

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(Array.isArray(dummyEntity.field)).toBeTruthy();
		expect(dummyEntity.field[0]).toBeInstanceOf(DummyRelationEntity);
		expect(dummyEntity.field[0].name).toBeNull();
	});

	it("should instantiate a list of entities", () => {
		class DummyEntity {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);
		const amount = 3;
		const dummyEntities = factory.newList(DummyEntity, amount);
		expect(dummyEntities).toHaveLength(amount);
	});

	it("should create list of overridable entities", () => {
		class DummyEntity {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);
		const amount = 3;
		const overridable = factory.createList(DummyEntity, amount);
		expect(overridable).toBeInstanceOf(Overridable);
	});

	it("should return the instance", () => {
		class DummyEntity {
			id: number;
			name: string;
		}

		const dummyInstance = new DummyEntity();
		dummyInstance.id = 1;
		dummyInstance.name = "Test Name";

		const overridable = new Overridable(dummyInstance);
		const instance = overridable.getInstance();

		expect(instance).toBe(dummyInstance);
		expect(instance.id).toBe(1);
		expect(instance.name).toBe("Test Name");
	});

	it("should override a field to null", () => {
		class DummyEntity {
			@FactoryField(() => 1)
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);
		const dummyEntity = factory.create(DummyEntity).override(() => ({
			name: null,
		}));

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(dummyEntity.name).toBeNull();
	});
});
