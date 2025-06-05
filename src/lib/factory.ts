import type { Faker } from "@faker-js/faker";
import { resolvePath } from "src/utils";
import { FACTORY_FIELD, FACTORY_RELATION } from "../constants";
import type { FactoryFieldMetadata, FactoryRelationMetadata } from "../decorators";
import type { DeepPartial, Select, Type } from "../interfaces";
import { Overridable } from "./overridable";

export class OneFactory<T> {
	private readonly factory: Factory;
	private readonly entity: Type<T>;
	private readonly select?: Select<T>;
	private overrideFn?: (instance: T) => DeepPartial<T>;
	private partialSelect?: Select<T>;

	constructor(factory: Factory, entity: Type<T>, select?: Select<T>) {
		this.factory = factory;
		this.entity = entity;
		this.select = select;
	}

	/**
	 * Overrides properties of the entity instance.
	 *
	 * @param overrideFn - Function that receives the instance and returns an object with properties to override
	 * @returns The OneFactory instance for chaining
	 */
	override(overrideFn: (instance: T) => DeepPartial<T>): OneFactory<T> {
		this.overrideFn = overrideFn;
		return this;
	}

	/**
	 * Creates a partial entity instance with only selected fields populated.
	 *
	 * @param select - Selection object to specify which fields to include
	 * @returns The OneFactory instance for chaining
	 * 
	 * @example
	 * const user = factory.one(User).partial({ name: true, email: true }).make();
	 */
	partial(select: Select<T>): OneFactory<T> {
		this.partialSelect = select;
		return this;
	}

	/**
	 * Makes and returns the entity instance.
	 *
	 * @returns The created entity instance
	 */
	make(): T {
		let instance: T;

		if (this.partialSelect) {
			// Create a partial instance
			instance = this.factory.partial(this.entity, this.partialSelect) as T;
		} else {
			// Create a full instance
			instance = this.factory.new(this.entity, this.select);
		}

		if (this.overrideFn) {
			return new Overridable(instance).override(this.overrideFn);
		}

		return instance;
	}

	/**
	 * Builds and returns the entity instance.
	 *
	 * @deprecated Use make() instead. This method will be removed in the next major release.
	 * @returns The created entity instance
	 */
	build(): T {
		return this.make();
	}
}

export class ManyFactory<T> {
	private readonly factory: Factory;
	private readonly entity: Type<T>;
	private readonly amount: number;
	private readonly select?: Select<T>;
	private overrideFn?: (instances: T[]) => DeepPartial<T>[];
	private partialSelect?: Select<T>;

	constructor(factory: Factory, entity: Type<T>, amount: number, select?: Select<T>) {
		this.factory = factory;
		this.entity = entity;
		this.amount = amount;
		this.select = select;
	}

	/**
	 * Overrides properties of the entity instances.
	 *
	 * @param overrideFn - Function that receives the instances and returns an array of objects with properties to override
	 * @returns The ManyFactory instance for chaining
	 */
	override(overrideFn: (instances: T[]) => DeepPartial<T>[]): ManyFactory<T> {
		this.overrideFn = overrideFn;
		return this;
	}

	/**
	 * Creates partial entity instances with only selected fields populated.
	 *
	 * @param select - Selection object to specify which fields to include
	 * @returns The ManyFactory instance for chaining
	 * 
	 * @example
	 * const users = factory.many(User, 5).partial({ name: true, email: true }).make();
	 */
	partial(select: Select<T>): ManyFactory<T> {
		this.partialSelect = select;
		return this;
	}

	/**
	 * Makes and returns the entity instances.
	 *
	 * @returns An array of created entity instances
	 */
	make(): T[] {
		let instances: T[];

		if (this.partialSelect) {
			// Create partial instances
			instances = new Array(this.amount).fill(null).map(() => 
				this.factory.partial(this.entity, this.partialSelect) as T
			);
		} else {
			// Create full instances
			instances = this.factory.newList(this.entity, this.amount, this.select);
		}

		if (this.overrideFn) {
			const overrides = this.overrideFn(instances);

			return instances.map((instance, index) => {
				if (index < overrides.length) {
					return new Overridable(instance).override(() => overrides[index]);
				}
				return instance;
			});
		}

		return instances;
	}

	/**
	 * Builds and returns the entity instances.
	 *
	 * @deprecated Use make() instead. This method will be removed in the next major release.
	 * @returns An array of created entity instances
	 */
	build(): T[] {
		return this.make();
	}
}

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
	 * Creates a factory for a single entity instance.
	 *
	 * @param entity - The entity class to instantiate
	 * @param select - Optional selection object to specify which fields to include
	 * @returns A OneFactory instance for the entity
	 *
	 * @example
	 * const user = factory.one(User).make();
	 * const userWithOverrides = factory.one(User).override(user => ({ name: 'John Doe' })).make();
	 */
	one<T>(entity: Type<T>, select?: Select<T>): OneFactory<T> {
		return new OneFactory<T>(this, entity, select);
	}

	/**
	 * Creates a factory for multiple entity instances.
	 *
	 * @param entity - The entity class to instantiate
	 * @param amount - The number of instances to create
	 * @param select - Optional selection object to specify which fields to include
	 * @returns A ManyFactory instance for the entities
	 *
	 * @example
	 * const users = factory.many(User, 5).make();
	 * const usersWithOverrides = factory.many(User, 5).override(users => users.map(user => ({ name: 'John Doe' }))).make();
	 */
	many<T>(entity: Type<T>, amount: number, select?: Select<T>): ManyFactory<T> {
		return new ManyFactory<T>(this, entity, amount, select);
	}

	/**
	 * Creates a new entity instance wrapped in an Overridable object.
	 *
	 * @param entity - The entity class to instantiate
	 * @param select - Optional selection object to specify which fields to include
	 * @returns An Overridable instance containing the created entity
	 * @deprecated Use factory.one(Entity).make() or factory.one(Entity).override().make() instead. This method will be removed in the next major release.
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
	 * @deprecated Use factory.many(Entity, amount).make() or factory.many(Entity, amount).override().make() instead. This method will be removed in the next major release.
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
	 * @deprecated Use factory.one(Entity).make() instead. This method will be removed in the next major release.
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
	 * @deprecated Use factory.many(Entity, amount).make() instead. This method will be removed in the next major release.
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
	 * @param isPartial - Whether to create partial relation instances
	 */

	private applyEntityRelations<T = any>(entity: Type<T>, instance: T, select?: Select<T>, isPartial = false) {
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
						// Create a relation instance (full or partial)
						const relationInstance = isPartial
							? this.partial(relationType, relationSelect || {})
							: this.new(relationType, relationSelect);

						// Bind the parent entity's key to the relation's inverse key
						this.applyKeyBinding(meta, instance, relationInstance);

						// Process nested relations for full instances
						if (!isPartial) {
							this.bindNestedRelations(relationInstance);
						}

						return relationInstance;
					});
					continue;
				}

				// Handle single relations (one-to-one)
				const relationInstance = isPartial
					? this.partial<unknown>(relationType, selectedField as Select<unknown>)
					: this.new<unknown>(relationType, selectedField);

				// Bind the parent entity's key to the relation's inverse key
				this.applyKeyBinding(meta, instance, relationInstance);

				// Process nested relations for full instances
				if (!isPartial) {
					this.bindNestedRelations(relationInstance);
				}

				instance[meta.property] = relationInstance;
			}
		}
	}

	/**
	 * Applies relations to an entity instance based on metadata and selection.
	 *
	 * @param entity - The entity class
	 * @param instance - The entity instance to apply relations to
	 * @param select - Optional selection object to specify which relations to include
	 */
	private applyRelations<T = any>(entity: Type<T>, instance: T, select?: Select<T>) {
		this.applyEntityRelations(entity, instance, select, false);
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
					this.applyKeyBinding(nestedMeta, relationInstance, nested);
				}
			} else if (nestedField && typeof nestedField === "object") {
				// Process the single relation
				this.applyKeyBinding(nestedMeta, relationInstance, nestedField);
			}
		}
	}

	/**
	 * Creates an instance of an entity with fields populated based on metadata and selection criteria.
	 *
	 * @param entity - The entity class to instantiate
	 * @param select - Selection object to specify which fields to include
	 * @param isPartial - Whether to create a partial instance (only include fields marked as true)
	 * @returns The created entity instance
	 */
	private createEntityInstance<T = any>(entity: Type<T>, select?: Select<T>, isPartial = false) {
		const instance = new entity();
		const fieldMetadata: Array<FactoryFieldMetadata> = Reflect.getMetadata(FACTORY_FIELD, entity) || [];

		for (const meta of fieldMetadata) {
			const fieldSelect = select?.[meta.property as keyof T];

			if (isPartial) {
				// For partial instances, only include fields explicitly marked as true
				if (fieldSelect === true) {
					instance[meta.property as keyof T] = meta.getValueFN(this.faker);
				}
			} else {
				// For full instances, include all fields unless explicitly marked as false
				if (fieldSelect !== false) {
					instance[meta.property as keyof T] = meta.getValueFN(this.faker);
				}
			}
		}

		return instance;
	}

	/**
	 * Creates an instance of an entity with all fields populated based on metadata.
	 *
	 * @param entity - The entity class to instantiate
	 * @param select - Optional selection object to specify which fields to include
	 * @returns The created entity instance
	 */
	private createInstance<T = any>(entity: Type<T>, select?: Select<T>) {
		return this.createEntityInstance(entity, select, false);
	}

	/**
	 * Creates a partial instance of an entity with only selected fields populated.
	 *
	 * @param entity - The entity class to instantiate
	 * @param select - Selection object to specify which fields to include
	 * @returns The created partial entity instance
	 */
	private createPartialInstance<T = any>(entity: Type<T>, select: Select<T>) {
		return this.createEntityInstance(entity, select, true);
	}

	/**
	 * Applies partial relations to an entity instance based on metadata and selection.
	 *
	 * @param entity - The entity class
	 * @param instance - The entity instance to apply relations to
	 * @param select - Selection object to specify which relations to include
	 */
	private applyPartialRelations<T = any>(entity: Type<T>, instance: T, select: Select<T>) {
		this.applyEntityRelations(entity, instance, select, true);
	}
}
