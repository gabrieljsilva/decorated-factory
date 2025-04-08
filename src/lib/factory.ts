import type { Faker } from "@faker-js/faker";
import { resolvePath } from "src/utils";
import { FACTORY_FIELD, FACTORY_RELATION } from "../constants";
import type { FactoryFieldMetadata, FactoryRelationMetadata } from "../decorators";
import type { DeepPartial, Select, Type } from "../interfaces";
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

	newList<T = any>(entity: Type<T>, amount: number, select?: Select<T>): Array<T> {
		return new Array(amount).fill(null).map(() => this.new(entity, select));
	}

	partial<T = any>(entity: Type<T>, select: Select<T>): DeepPartial<T> {
		const instance = this.createPartialInstance(entity, select);
		this.applyPartialRelations(entity, instance, select);
		return instance as DeepPartial<T>;
	}

	private applyRelations<T = any>(entity: Type<T>, instance: T, select?: Select<T>) {
		const relationFieldMetadata: Array<FactoryRelationMetadata> = Reflect.getMetadata(FACTORY_RELATION, entity) || [];

		for (const meta of relationFieldMetadata) {
			const selectedField = select?.[meta.property as keyof T];

			if (selectedField) {
				const returnType = meta.returnTypeFn();
				const isRelationArray = Array.isArray(returnType);
				const relationType = isRelationArray ? returnType[0] : returnType;

				if (isRelationArray) {
					const [instancesToCreate, relationSelect] = selectedField as [number, Select<unknown>];
					instance[meta.property] = new Array(instancesToCreate).fill(null).map(() => {
						const relationInstance = this.new(relationType, relationSelect);

						// Handle primary binding
						if (meta.keyBinding) {
							const parentValue = resolvePath(instance, meta.keyBinding.key);
							if (parentValue !== undefined) {
								relationInstance[meta.keyBinding.inverseKey] = parentValue;
							}
						}

						// Handle nested relations
						this.bindNestedRelations(relationInstance, instance);

						return relationInstance;
					});
					continue;
				}

				const relationInstance = this.new<unknown>(relationType, selectedField);

				// Handle primary binding
				if (meta.keyBinding) {
					const parentValue = resolvePath(instance, meta.keyBinding.key);
					if (parentValue !== undefined) {
						relationInstance[meta.keyBinding.inverseKey] = parentValue;
					}
				}

				// Handle nested relations
				this.bindNestedRelations(relationInstance, instance);

				instance[meta.property] = relationInstance;
			}
		}
	}

	private bindNestedRelations(relationInstance: any, parentInstance: any) {
		// Get relation metadata for the relation instance
		const nestedRelationMetadata: Array<FactoryRelationMetadata> =
			Reflect.getMetadata(FACTORY_RELATION, relationInstance.constructor) || [];

		for (const nestedMeta of nestedRelationMetadata) {
			const nestedField = relationInstance[nestedMeta.property];
			if (!nestedField) continue;

			if (Array.isArray(nestedField)) {
				for (const nested of nestedField) {
					if (nestedMeta.keyBinding) {
						const parentValue = resolvePath(relationInstance, nestedMeta.keyBinding.key);
						if (parentValue !== undefined) {
							nested[nestedMeta.keyBinding.inverseKey] = parentValue;
						}
					}
				}
			} else if (nestedField && typeof nestedField === "object") {
				if (nestedMeta.keyBinding) {
					const parentValue = resolvePath(relationInstance, nestedMeta.keyBinding.key);
					if (parentValue !== undefined) {
						nestedField[nestedMeta.keyBinding.inverseKey] = parentValue;
					}
				}
			}
		}
	}

	private createInstance<T = any>(entity: Type<T>, select?: Select<T>) {
		const instance = new entity();
		const fieldMetadata: Array<FactoryFieldMetadata> = Reflect.getMetadata(FACTORY_FIELD, entity) || [];

		for (const meta of fieldMetadata) {
			const fieldSelect = select?.[meta.property as keyof T];
			if (fieldSelect === false) {
				continue;
			}
			instance[meta.property as keyof T] = meta.getValueFN(this.faker);
		}

		return instance;
	}

	private createPartialInstance<T = any>(entity: Type<T>, select: Select<T>) {
		const instance = new entity();
		const fieldMetadata: Array<FactoryFieldMetadata> = Reflect.getMetadata(FACTORY_FIELD, entity) || [];

		for (const meta of fieldMetadata) {
			const fieldSelect = select[meta.property as keyof T];
			if (fieldSelect === true) {
				instance[meta.property as keyof T] = meta.getValueFN(this.faker);
			}
		}

		return instance;
	}

	private applyPartialRelations<T = any>(entity: Type<T>, instance: T, select: Select<T>) {
		const relationFieldMetadata: Array<FactoryRelationMetadata> = Reflect.getMetadata(FACTORY_RELATION, entity) || [];

		for (const meta of relationFieldMetadata) {
			const selectedField = select[meta.property as keyof T];

			if (selectedField) {
				const returnType = meta.returnTypeFn();
				const isRelationArray = Array.isArray(returnType);
				const relationType = isRelationArray ? returnType[0] : returnType;

				if (isRelationArray) {
					const [instancesToCreate, relationSelect] = selectedField as [number, Select<unknown>];
					instance[meta.property] = new Array(instancesToCreate).fill(null).map(() => {
						const relationInstance = this.partial(relationType, relationSelect || {});

						// Handle primary binding if needed
						if (meta.keyBinding) {
							const parentValue = instance[meta.keyBinding.key as keyof T];
							if (parentValue !== undefined) {
								relationInstance[meta.keyBinding.inverseKey] = parentValue;
							}
						}

						return relationInstance;
					});
					continue;
				}

				const relationInstance = this.partial<unknown>(relationType, selectedField as Select<unknown>);

				// Handle primary binding if needed
				if (meta.keyBinding) {
					const parentValue = instance[meta.keyBinding.key as keyof T];
					if (parentValue !== undefined) {
						relationInstance[meta.keyBinding.inverseKey] = parentValue;
					}
				}

				instance[meta.property] = relationInstance;
			}
		}
	}
}
