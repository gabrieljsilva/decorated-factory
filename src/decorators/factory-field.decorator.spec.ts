import "reflect-metadata";
import { FACTORY_FIELD } from "../constants";
import { FactoryField } from "./factory-field.decorator";

describe("FactoryField tests", () => {
	it("should add metadata field", () => {
		const getValueFn = () => "Hello World";
		class DummyEntity {
			@FactoryField(getValueFn)
			field: string;
		}

		const metadata = Reflect.getMetadata(FACTORY_FIELD, DummyEntity);
		expect(metadata).toEqual([
			{
				property: "field",
				getValueFN: getValueFn,
			},
		]);
	});
});
