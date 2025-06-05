import "reflect-metadata";
import { FACTORY_FIELD } from "../constants";
import { FactoryField } from "./factory-field.decorator";

describe("FactoryField tests", () => {
	it("should add metadata field", () => {
		const getValueFn = () => "Hello World";
		class Cat {
			@FactoryField(getValueFn)
			field: string;
		}

		const metadata = Reflect.getMetadata(FACTORY_FIELD, Cat);
		expect(metadata).toEqual([
			{
				property: "field",
				getValueFN: getValueFn,
			},
		]);
	});
});
