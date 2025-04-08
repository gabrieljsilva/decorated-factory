import type { Faker } from "@faker-js/faker";
import { resolvePath } from "src/utils";
import { FACTORY_FIELD, FACTORY_RELATION } from "../constants";
import type { FactoryFieldMetadata, FactoryRelationMetadata } from "../decorators";
import type { DeepPartial, Select, Type } from "../interfaces";
import { Overridable } from "./overridable";

/**
 * Factory class for creating test entities with auto-generated data.
 * 
 * This class provides methods to create entities with their fields populated using faker data,
 * and handles relationships between entities, including key bindings.
 */
export class Factory {
	private readonly faker: Faker;

	/**
	 * Creates a new Factory instance with the provided faker instance.
	 * 
	 * @param fakerInstance - The faker instance to use for generating data
	 */
	constructor(fakerInstance: Faker) {
		this.faker = fakerInstance;
	}

	/**
	 * Creates a new entity instance wrapped in an Overridable object.
	 * 
	 * @param entity - The entity class to instantiate
	 * @param select - Optional selection object to specify which fields to include
	 * @returns An Overridable instance containing the created entity
	 */
	create<T>(entity: Type<T>, select?: Select<T>) {
		return new Overridable(this.new(entity, select));
	}

	/**
	 * Creates a list of entity instances wrapped in an Overridable object.
	 * 
	 * @param entity - The entity class to instantiate
	 * @param amount - The number of instances to create
	 * @param select - Optional selection object to specify which fields to include
	 * @returns An Overridable instance containing the array of created entities
	 */
	createList<T>(entity: Type<T>, amount: number, select?: Select<T>) {
		const entities = this.newList(entity, amount, select);
		return new Overridable(entities);
	}

	/**
	 * Creates a new entity instance with all fields populated.
	 * 
	 * @param entity - The entity class to instantiate
	 * @param select - Optional selection object to specify which fields to include
	 * @returns The created entity instance
	 */
	new<T = any>(entity: Type<T>, select?: Select<T>): T {
		const instance = this.createInstance(entity, select);
		this.applyRelations(entity, instance, select);
		return instance;
	}

	/**
	 * Creates a list of entity instances with all fields populated.
	 * 
	 * @param entity - The entity class to instantiate
	 * @param amount - The number of instances to create
	 * @param select - Optional selection object to specify which fields to include
	 * @returns An array of created entity instances
	 */
	newList<T = any>(entity: Type<T>, amount: number, select?: Select<T>): Array<T> {
		return new Array(amount).fill(null).map(() => this.new(entity, select));
	}

	/**
	 * Creates a partial entity instance with only selected fields populated.
	 * 
	 * @param entity - The entity class to instantiate
	 * @param select - Selection object to specify which fields to include
	 * @returns The created partial entity instance
	 */
	partial<T = any>(entity: Type<T>, select: Select<T>): DeepPartial<T> {
		const instance = this.createPartialInstance(entity, select);
		this.applyPartialRelations(entity, instance, select);
		return instance as DeepPartial<T>;
	}

	/**
	 * Applies relations to an entity instance based on metadata and selection.
	 * 
	 * @param entity - The entity class
	 * @param instance - The entity instance to apply relations to
	 * @param select - Optional selection object to specify which relations to include
	 */
	private applyRelations<T = any>(entity: Type<T>, instance: T, select?: Select<T>) {
		const relationFieldMetadata: Array<FactoryRelationMetadata> = Reflect.getMetadata(FACTORY_RELATION, entity) || [];

		for (const meta of relationFieldMetadata) {
			const selectedField = select?.[meta.property as keyof T];

			if (selectedField) {
				const returnType = meta.returnTypeFn();
				const isRelationArray = Array.isArray(returnType);
				const relationType = isRelationArray ? returnType[0] : returnType;

				if (isRelationArray) {
					// Handle array relations (one-to-many)
					const [instancesToCreate, relationSelect] = selectedField as [number, Select<unknown>];
					instance[meta.property] = new Array(instancesToCreate).fill(null).map(() => {
						const relationInstance = this.new(relationType, relationSelect);

						// Bind the parent entity's key to the relation's inverse key
						this.applyKeyBinding(meta, instance, relationInstance);

						// Process nested relations within this relation
						this.bindNestedRelations(relationInstance);

						return relationInstance;
					});
					continue;
				}

				// Handle single relations (one-to-one)
				const relationInstance = this.new<unknown>(relationType, selectedField);

				// Bind the parent entity's key to the relation's inverse key
				this.applyKeyBinding(meta, instance, relationInstance);

				// Process nested relations within this relation
				this.bindNestedRelations(relationInstance);

				instance[meta.property] = relationInstance;
			}
		}
	}

	/**
	 * Binds keys between a parent entity and a related entity based on key binding metadata.
	 * 
	 * @param meta - The relation metadata containing key binding information
	 * @param parentInstance - The parent entity instance
	 * @param relationInstance - The related entity instance
	 */
	private applyKeyBinding(meta: FactoryRelationMetadata, parentInstance: any, relationInstance: any) {
		if (meta.keyBinding) {
			const parentValue = resolvePath(parentInstance, meta.keyBinding.key);
			if (parentValue !== undefined) {
				relationInstance[meta.keyBinding.inverseKey] = parentValue;
			}
		}
	}

	/**
	 * Processes nested relations within a relation instance.
	 * 
	 * @param relationInstance - The relation instance to process nested relations for
	 */
	private bindNestedRelations(relationInstance: any) {
		// Get relation metadata for the relation instance
		const nestedRelationMetadata: Array<FactoryRelationMetadata> =
			Reflect.getMetadata(FACTORY_RELATION, relationInstance.constructor) || [];

		for (const nestedMeta of nestedRelationMetadata) {
			const nestedField = relationInstance[nestedMeta.property];
			if (!nestedField) continue;

			if (Array.isArray(nestedField)) {
				// Process each item in the array relation
				for (const nested of nestedField) {
					if (nestedMeta.keyBinding) {
						const parentValue = resolvePath(relationInstance, nestedMeta.keyBinding.key);
						if (parentValue !== undefined) {
							nested[nestedMeta.keyBinding.inverseKey] = parentValue;
						}
					}
				}
			} else if (nestedField && typeof nestedField === "object") {
				// Process the single relation
				if (nestedMeta.keyBinding) {
					const parentValue = resolvePath(relationInstance, nestedMeta.keyBinding.key);
					if (parentValue !== undefined) {
						nestedField[nestedMeta.keyBinding.inverseKey] = parentValue;
					}
				}
			}
		}
	}

	/**
	 * Creates an instance of an entity with all fields populated based on metadata.
	 * 
	 * @param entity - The entity class to instantiate
	 * @param select - Optional selection object to specify which fields to include
	 * @returns The created entity instance
	 */
	private createInstance<T = any>(entity: Type<T>, select?: Select<T>) {
		const instance = new entity();
		const fieldMetadata: Array<FactoryFieldMetadata> = Reflect.getMetadata(FACTORY_FIELD, entity) || [];

		for (const meta of fieldMetadata) {
			const fieldSelect = select?.[meta.property as keyof T];
			// Skip fields explicitly marked as false in the select object
			if (fieldSelect === false) {
				continue;
			}
			// Generate a value for the field using the faker instance
			instance[meta.property as keyof T] = meta.getValueFN(this.faker);
		}

		return instance;
	}

	/**
	 * Creates a partial instance of an entity with only selected fields populated.
	 * 
	 * @param entity - The entity class to instantiate
	 * @param select - Selection object to specify which fields to include
	 * @returns The created partial entity instance
	 */
	private createPartialInstance<T = any>(entity: Type<T>, select: Select<T>) {
		const instance = new entity();
		const fieldMetadata: Array<FactoryFieldMetadata> = Reflect.getMetadata(FACTORY_FIELD, entity) || [];

		for (const meta of fieldMetadata) {
			const fieldSelect = select[meta.property as keyof T];
			// Only include fields explicitly marked as true in the select object
			if (fieldSelect === true) {
				// Generate a value for the field using the faker instance
				instance[meta.property as keyof T] = meta.getValueFN(this.faker);
			}
		}

		return instance;
	}

	/**
	 * Applies partial relations to an entity instance based on metadata and selection.
	 * 
	 * @param entity - The entity class
	 * @param instance - The entity instance to apply relations to
	 * @param select - Selection object to specify which relations to include
	 */
	private applyPartialRelations<T = any>(entity: Type<T>, instance: T, select: Select<T>) {
		const relationFieldMetadata: Array<FactoryRelationMetadata> = Reflect.getMetadata(FACTORY_RELATION, entity) || [];

		for (const meta of relationFieldMetadata) {
			const selectedField = select[meta.property as keyof T];

			if (selectedField) {
				const returnType = meta.returnTypeFn();
				const isRelationArray = Array.isArray(returnType);
				const relationType = isRelationArray ? returnType[0] : returnType;

				if (isRelationArray) {
					// Handle array relations (one-to-many)
					const [instancesToCreate, relationSelect] = selectedField as [number, Select<unknown>];
					instance[meta.property] = new Array(instancesToCreate).fill(null).map(() => {
						// Create a partial instance of the relation
						const relationInstance = this.partial(relationType, relationSelect || {});

						// Bind the parent entity's key to the relation's inverse key
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

				// Handle single relations (one-to-one)
				const relationInstance = this.partial<unknown>(relationType, selectedField as Select<unknown>);

				// Bind the parent entity's key to the relation's inverse key
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
