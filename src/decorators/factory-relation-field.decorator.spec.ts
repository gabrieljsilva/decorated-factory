import "reflect-metadata";
import { faker } from "@faker-js/faker";
import { Factory } from "src/lib";
import { FACTORY_FIELD, FACTORY_RELATION } from "../constants";
import { FactoryField } from "./factory-field.decorator";
import {
	FactoryRelationField,
	type FactoryRelationMetadata,
} from "./factory-relation-field.decorator";

describe("FactoryRelationField tests", () => {
	it("should add relation metadata to field", () => {
		class DummyRelationEntity {
			@FactoryField(() => "Hello World")
			message: string;
		}

		class DummyEntity {
			@FactoryRelationField(() => DummyRelationEntity)
			field: DummyRelationEntity;
		}

		const [metadata] = Reflect.getMetadata(
			FACTORY_RELATION,
			DummyEntity,
		) as Array<FactoryRelationMetadata>;
		const type = metadata.returnTypeFn();
		expect(type).toBe(DummyRelationEntity);
		expect(metadata.property).toBe("field");

		const [relationMetadata] = Reflect.getMetadata(
			FACTORY_FIELD,
			DummyRelationEntity,
		);
		expect(relationMetadata.property).toBe("message");
		expect(relationMetadata.getValueFN).toBeInstanceOf(Function);
	});

	it("should bind keys", async () => {
		class Photo {
			@FactoryField((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryField((faker) => faker.image.url())
			url: string;

			@FactoryField((faker) => faker.number.int({ min: 1, max: 1000 }))
			userId: number;
		}

		class User {
			@FactoryField((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryField((faker) => faker.person.fullName())
			name: string;

			@FactoryRelationField(() => [Photo], {
				key: "id",
				inverseField: "userId",
			})
			photos: Photo[];
		}

		const factory = new Factory(faker);

		const userWithPhoto = factory.new(User, {
			photos: [5],
		});

		console.log(userWithPhoto);
	});
});
