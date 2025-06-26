import type { Faker } from "@faker-js/faker";
import { BUILT_IN_TYPES, FACTORY_TYPE, FACTORY_VALUE } from "../constants";
import type { FactoryTypeMetadata, FactoryValueMetadata } from "../decorators";
import type { ArrayPaths, BuildOpts, Paths, Type } from "../interfaces";
import { Plain } from "../interfaces/plain";
import { AutoIncrement } from "./built-in-types";

/**
 * Builder for creating entity instances with customizable properties.
 *
 * @template T - The entity type.
 * @template M - Indicates whether the builder will create **many** (`true`) or **one** (`false`) instance.
 */
class EntityBuilder<T, M extends boolean = false> {
	private readonly faker: Faker;
	private readonly entityType: Type<T>;
	private readonly relations = new Map<string, number | undefined>();
	private readonly exclusions = new Set<string>();
	private readonly overrides = new Map<string, any>();
	private readonly globalAutoCounters = new Map<string, number>();
	private readonly localAutoCounters = new Map<T, Map<string, number>>();
	private currentRoot: T | null = null;
	private asPlain: boolean;

	constructor({ faker, entity, plain = false }: BuildOpts<T>) {
		this.faker = faker;
		this.entityType = entity;
		this.asPlain = plain;
	}

	/**
	 * Request a (nested) relation. No amount → single instance.
	 *
	 * @example .with("photo.upload")
	 */
	public with<P extends Paths<T>>(path: P): this;

	/**
	 * Request that an **array** relation/field be filled with `amount` items.
	 * The path **must** reference an array property – checked at compile‑time.
	 *
	 * @example .with(5, "photos")
	 */
	public with<P extends ArrayPaths<T>>(amount: number, path: P): this;
	public with(amountOrPath: number | string, maybePath?: string): this {
		if (typeof amountOrPath === "number") {
			if (amountOrPath < 0) {
				throw new Error(`Amount supplied to .with() must be zero or positive, but got ${amountOrPath}`);
			}

			this.relations.set(maybePath as string, amountOrPath);
			return this;
		}

		this.relations.set(amountOrPath, undefined);
		return this;
	}

	/**
	 * Exclude a (nested) property from the generated instance.
	 */
	public without<P extends Paths<T>>(path: P): this {
		this.exclusions.add(path as string);
		return this;
	}

	/**
	 * Override a property value. For nested overrides the corresponding relation
	 * must have been requested previously through `.with()`.
	 */
	public set<P extends Paths<T>>(path: P, value: any): this {
		const parts = (path as string).split(".");
		if (parts.length > 1) {
			const parent = parts.slice(0, -1).join(".");
			if (!this.hasRelation(parent)) {
				throw new Error(`Cannot override nested path "${path}" – missing .with("${parent}") call`);
			}
		}

		this.overrides.set(path as string, value);
		return this;
	}

	/**
	 * Creates and returns entity instance(s) according to the configuration.
	 *
	 * When the builder was obtained via `Factory.one` it returns a single entity.
	 * When obtained via `Factory.many` it returns an array.
	 */
	public make(size?: M extends true ? number : never): M extends true ? T[] : T {
		const rootAmount = size ?? this.relations.get("__root__");

		if (typeof rootAmount === "number") {
			if (rootAmount < 0) {
				throw new Error(`Amount supplied to .make() must be zero or positive, but got ${rootAmount}`);
			}

			const list: T[] = [];
			for (let i = 0; i < rootAmount; i++) {
				list.push(this.spawnRoot());
			}
			return list as any;
		}

		return this.spawnRoot() as any;
	}

	public plain(size?: M extends true ? number : never): M extends true ? Plain<T>[] : Plain<T> {
		this.asPlain = true;
		return this.make(size) as M extends true ? Plain<T>[] : Plain<T>;
	}

	/**
	 * Instantiates and fully populates a single root entity.
	 */
	private spawnRoot(): T {
		const root = this.asPlain ? ({} as T) : new this.entityType();
		this.currentRoot = root;
		this.populate(root, this.entityType, "");
		return root;
	}

	/**
	 * Creates a child entity instance and populates it.
	 */
	private spawnChild(entityType: Type<any>, path: string) {
		// special-case the new type
		if (entityType === AutoIncrement) {
			return this.generateAutoIncrement(path);
		}

		// unchanged ↓
		if (BUILT_IN_TYPES.has(entityType)) {
			const valueGenerator = BUILT_IN_TYPES.get(entityType);
			return valueGenerator ? valueGenerator(this.faker) : null;
		}

		const instance = new entityType();
		this.populate(instance, entityType, path);
		return instance;
	}

	/**
	 * Checks if a relation exists at the given path or as a child of the path.
	 */
	private hasRelation(path: string) {
		for (const key of this.relations.keys()) {
			if (key === path) return true;
			if (key.startsWith(`${path}.`)) return true;
		}
		return false;
	}

	/**
	 * Populates an entity with field values and relations.
	 *
	 * @param target - The target object to populate
	 * @param entityType - The entity type
	 * @param prefix - The current path prefix
	 */
	private populate(target: any, entityType: Type<any>, prefix: string) {
		for (const field of this.readFieldMeta(entityType)) {
			const full = prefix ? `${prefix}.${field.property}` : field.property;
			if (this.exclusions.has(full)) continue;

			if (this.overrides.has(full)) {
				target[field.property] = this.overrides.get(full);
				continue;
			}

			const amount = this.relations.get(full);
			if (typeof amount === "number") {
				const items: any[] = [];
				for (let i = 0; i < amount; i++) items.push(field.getValueFN(this.faker));
				target[field.property] = items;
				continue;
			}

			// Handle array fields based on isArray property
			if (field.isArray) {
				const items: any[] = [];
				// If the amount is not specified, generate one item
				const itemCount = typeof amount === "number" ? amount : 1;
				for (let i = 0; i < itemCount; i++) {
					items.push(field.getValueFN(this.faker));
				}
				target[field.property] = items;
				continue;
			}

			target[field.property] = field.getValueFN(this.faker);
		}

		for (const relation of this.readRelationMeta(entityType)) {
			const full = prefix ? `${prefix}.${relation.property}` : relation.property;

			if (this.exclusions.has(full)) continue;

			if (this.overrides.has(full)) {
				target[relation.property] = this.overrides.get(full);
				continue;
			}

			const returnType = relation.returnTypeFn();
			const actualType = Array.isArray(returnType) ? returnType[0] : returnType;

			const isBuiltInType = BUILT_IN_TYPES.has(actualType);
			if (!isBuiltInType && !this.hasRelation(full)) continue;

			const asArray = Array.isArray(returnType);

			if (asArray && (returnType as [Type<any>])[0] === AutoIncrement) {
				throw new Error("cannot generate an array of AutoIncrement values");
			}

			const count = this.relations.get(full) ?? 1;

			if (asArray) {
				const childArr: any[] = [];
				const childType = (returnType as [Type<any>])[0];
				for (let i = 0; i < (count as number); i++) {
					const child = this.spawnChild(childType, full);
					this.bindKeys(target, child, relation);
					childArr.push(child);
				}
				target[relation.property] = childArr;
				continue;
			}

			const child = this.spawnChild(returnType as Type<any>, full);
			this.bindKeys(target, child, relation);
			target[relation.property] = child;
		}
	}

	/**
	 * Binds keys between parent and child entities based on metadata.
	 */
	private bindKeys(parent: any, child: any, meta: FactoryTypeMetadata) {
		const keyBinding = meta.keyBinding;
		if (!keyBinding) return;
		child[keyBinding.inverseKey as string] = parent[keyBinding.key as string];
	}

	private readFieldMeta(entity: Type<any>): FactoryValueMetadata[] {
		return (Reflect.getMetadata(FACTORY_VALUE, entity) as FactoryValueMetadata[]) || [];
	}

	private readRelationMeta(entity: Type<any>): FactoryTypeMetadata[] {
		return (Reflect.getMetadata(FACTORY_TYPE, entity) as FactoryTypeMetadata[]) || [];
	}

	/** Returns the next AutoIncrement value for the given property path. */
	private generateAutoIncrement(fullPath: string): number {
		if (fullPath.includes(".")) {
			if (!this.currentRoot) throw new Error("No root context");
			let counters = this.localAutoCounters.get(this.currentRoot);
			if (!counters) {
				counters = new Map<string, number>();
				this.localAutoCounters.set(this.currentRoot, counters);
			}
			const next = (counters.get(fullPath) ?? 0) + 1;
			counters.set(fullPath, next);
			return next;
		}

		const next = (this.globalAutoCounters.get(fullPath) ?? 0) + 1;
		this.globalAutoCounters.set(fullPath, next);
		return next;
	}
}

/**
 * Factory for creating entity instances.
 */
export class Factory {
	private readonly fake: Faker;

	constructor(faker: Faker) {
		this.fake = faker;
	}

	/**
	 * Builder for a single entity instance.
	 */
	public one<T>(entity: Type<T>) {
		return new EntityBuilder<T, false>({ faker: this.fake, entity });
	}

	/**
	 * Builder for multiple entity instances.
	 */
	public many<T>(entity: Type<T>) {
		const defaultAmount = 1;
		return new EntityBuilder<T, true>({ faker: this.fake, entity }).with(defaultAmount, "__root__" as any);
	}
}
