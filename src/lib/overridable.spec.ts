// overridable.spec.ts
import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { Overridable } from "./overridable";

describe("Overridable tests", () => {
	it("should create an overridable instance", () => {
		const instance = { foo: "bar" };
		const overridable = new Overridable(instance);

		expect(overridable).toBeInstanceOf(Overridable);
		expect(overridable.getInstance()).toBe(instance);
	});

	it("should override simple properties", () => {
		const instance = { foo: "bar", num: 1 };
		const overridable = new Overridable(instance);

		const result = overridable.override(() => ({
			foo: "baz",
			num: 2,
		}));

		expect(result.foo).toBe("baz");
		expect(result.num).toBe(2);
	});

	it("should deep merge nested objects", () => {
		const instance = {
			nested: {
				foo: "bar",
				num: 1,
			},
		};
		const overridable = new Overridable(instance);

		const result = overridable.override(() => ({
			nested: {
				foo: "baz",
			},
		}));

		expect(result.nested.foo).toBe("baz");
		expect(result.nested.num).toBe(1); // Original value should remain
	});

	it("should merge arrays", () => {
		const instance = {
			items: [
				{ id: 1, name: "Item 1" },
				{ id: 2, name: "Item 2" },
			],
		};
		const overridable = new Overridable(instance);

		const result = overridable.override(() => ({
			items: [{ name: "Updated Item 1" }],
		}));

		expect(result.items[0].id).toBe(1); // Original value should remain
		expect(result.items[0].name).toBe("Updated Item 1");
		expect(result.items[1].name).toBe("Item 2"); // Second item should remain unchanged
	});

	it("should handle null values in override", () => {
		const instance = {
			foo: "bar",
			nested: {
				value: "test",
			},
		};

		const overridable = new Overridable(instance);

		const result = overridable.override(() => ({
			foo: null,
		}));

		expect(result.foo).toBeNull();
	});

	it("should handle date values in override", () => {
		const instance = {
			foo: null,
		};

		const overridable = new Overridable(instance);

		const result = overridable.override(() => ({
			foo: new Date("2025-01-01T00:00:00.000Z"),
		}));

		expect(result.foo).toBeInstanceOf(Date);
	});

	it("should handle primitive array values", () => {
		const instance = {
			numbers: [1, 2, 3],
		};
		const overridable = new Overridable(instance);

		const result = overridable.override(() => ({
			numbers: [4, 5],
		}));

		expect(result.numbers[0]).toBe(4);
		expect(result.numbers[1]).toBe(5);
		expect(result.numbers[2]).toBe(3); // Original value should remain
	});
});
