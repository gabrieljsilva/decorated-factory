import type { Faker } from "@faker-js/faker";
import { FACTORY_FIELD, FACTORY_RELATION } from "../constants";
import type {
	FactoryFieldMetadata,
	FactoryRelationMetadata,
} from "../decorators";
import type { Select, Type } from "../interfaces";
import { Overridable } from "./overridable";

export class Factory {
	private readonly faker: Faker;

	constructor(fakerInstance: Faker) {
		this.faker = fakerInstance;
	}

	create<T>(entity: Type<T>, select?: Select<T>) {
		return new Overridable(this.new(entity, select));
	}

	createList<T>(entity: Type<T>, amount: number, select?: Select<T>) {
		const entities = this.newList(entity, amount, select);
		return new Overridable(entities);
	}

	new<T = any>(entity: Type<T>, select?: Select<T>): T {
		const instance = this.createInstance(entity, select);
		this.applyRelations(entity, instance, select);
		return instance;
	}

	newList<T = any>(
		entity: Type<T>,
		amount: number,
		select?: Select<T>,
	): Array<T> {
		return new Array(amount).fill(null).map(() => this.new(entity, select));
	}

	private applyRelations<T = any>(
		entity: Type<T>,
		instance: T,
		select?: Select<T>,
	) {
		const relationFieldMetadata: Array<FactoryRelationMetadata> =
			Reflect.getMetadata(FACTORY_RELATION, entity) || [];

		for (const meta of relationFieldMetadata) {
			const selectedField = select?.[meta.property as keyof T];

			if (selectedField) {
				const returnType = meta.returnTypeFn();
				const isRelationArray = Array.isArray(returnType);
				const relationType = isRelationArray ? returnType[0] : returnType;

				if (isRelationArray) {
					const [instancesToCreate, relationSelect] = selectedField as [
						number,
						Select<unknown>,
					];
					instance[meta.property] = new Array(instancesToCreate)
						.fill(null)
						.map(() => this.new(relationType, relationSelect));
					continue;
				}

				instance[meta.property] = this.new<unknown>(
					relationType,
					selectedField,
				);
			}
		}
	}

	private createInstance<T = any>(entity: Type<T>, select?: Select<T>) {
		const instance = new entity();
		const fieldMetadata: Array<FactoryFieldMetadata> =
			Reflect.getMetadata(FACTORY_FIELD, entity) || [];

		for (const meta of fieldMetadata) {
			const fieldSelect = select?.[meta.property as keyof T];
			if (fieldSelect === false) {
				continue;
			}
			instance[meta.property as keyof T] = meta.getValueFN(this.faker);
		}

		return instance;
	}
}
