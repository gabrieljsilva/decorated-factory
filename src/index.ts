import { faker } from "@faker-js/faker";
import { FactoryField, FactoryRelationField } from "src/decorators";
import { Factory } from "src/lib";

export { FactoryField } from "./decorators/factory-field.decorator";
export { FactoryRelationField } from "./decorators/factory-relation-field.decorator";
export { Factory } from "./lib/factory";
export { Overridable } from "./lib/overridable";

export class Photo {
	@FactoryField((faker) => faker.number.int({ min: 1, max: 1000 }))
	id: number;

	@FactoryField((faker) => faker.image.url())
	url: string;

	@FactoryField((faker) => faker.number.int({ min: 1, max: 1000 }))
	userId: number;
}

export class User {
	@FactoryField((faker) => faker.number.int({ min: 1, max: 1000 }))
	id: number;

	@FactoryField((faker) => faker.person.fullName())
	name: string;

	@FactoryRelationField(() => Photo)
	photo: Photo;
}

const factory = new Factory(faker);

const userWithPhoto = factory.new(User, {
	photo: true,
});
