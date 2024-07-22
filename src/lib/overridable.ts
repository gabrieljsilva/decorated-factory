import type { DeepPartial } from "../interfaces";

export class Overridable<T> {
	private readonly instance: T;

	constructor(instance: T) {
		this.instance = instance;
	}

	override(override: (instance: T) => DeepPartial<T>) {
		this.deepMerge(this.instance, override(this.instance));
		return this.instance;
	}

	getInstance() {
		return this.instance;
	}

	private deepMerge(entity: NonNullable<any>, override: DeepPartial<any>) {
		if (!override) return;

		for (const [key, value] of Object.entries(override)) {
			if (Array.isArray(entity[key]) && Array.isArray(value)) {
				this.mergeArray(entity[key], value);
				continue;
			}
			if (typeof value === "object" && typeof entity[key] === "object") {
				this.deepMerge(entity[key], value);
				continue;
			}
			entity[key] = value;
		}
	}

	private mergeArray(entityArray: any[], overrideArray: any[]) {
		for (const [index, valueToMerge] of overrideArray.entries()) {
			if (typeof valueToMerge === "object") {
				this.deepMerge(entityArray[index], valueToMerge);
				continue;
			}
			entityArray[index] = valueToMerge;
		}
	}
}
