import { DeepPartial } from "src/interfaces";

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
			if (value instanceof Date) {
				entity[key] = value;
				continue;
			}

			if (Array.isArray(entity[key]) && Array.isArray(value)) {
				this.mergeArray(entity[key], value);
				continue;
			}
			if (value !== null && typeof value === "object" && typeof entity[key] === "object") {
				this.deepMerge(entity[key], value);
				continue;
			}
			entity[key] = value;
		}
	}

	private mergeArray(entityArray: any[], overrideArray: any[]) {
		for (const [index, valueToMerge] of overrideArray.entries()) {
			if (valueToMerge instanceof Date) {
				entityArray[index] = valueToMerge;
				continue;
			}
			if (typeof valueToMerge === "object" && valueToMerge !== null) {
				this.deepMerge(entityArray[index], valueToMerge);
				continue;
			}
			entityArray[index] = valueToMerge;
		}
	}
}
