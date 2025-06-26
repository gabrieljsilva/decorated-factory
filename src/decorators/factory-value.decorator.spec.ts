import "reflect-metadata";
import { FACTORY_VALUE } from "../constants";
import { FactoryValue } from "./factory-value.decorator";

describe("FactoryField tests", () => {
	it("should add metadata field", () => {
		const getValueFn = () => "Hello World";
		class Cat {
			@FactoryValue(getValueFn)
			field: string;
		}

		const metadata = Reflect.getMetadata(FACTORY_VALUE, Cat);
		expect(metadata).toEqual([
			{
				property: "field",
				getValueFN: getValueFn,
			},
		]);
	});
});
