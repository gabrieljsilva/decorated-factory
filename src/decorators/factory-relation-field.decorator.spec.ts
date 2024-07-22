import "reflect-metadata";
import {
	FACTORY_FIELD,
	FACTORY_RELATION,
} from "@constants/metadata-keys.constants";
import { FactoryField } from "@decorators/factory-field.decorator";
import {
	FactoryRelationField,
	type FactoryRelationMetadata,
} from "@decorators/factory-relation-field.decorator";

describe("FactoryRelationField tests", () => {
	it("should add relation metadata to field", () => {
		class DummyRelationEntity {
			@FactoryField(() => "Hello World")
			message: string;
		}

		class DummyEntity {
			@FactoryRelationField(() => DummyRelationEntity)
			field: DummyRelationEntity;
		}

		const [metadata] = Reflect.getMetadata(
			FACTORY_RELATION,
			DummyEntity,
		) as Array<FactoryRelationMetadata>;
		const type = metadata.returnTypeFn();
		expect(type).toBe(DummyRelationEntity);
		expect(metadata.property).toBe("field");

		const [relationMetadata] = Reflect.getMetadata(
			FACTORY_FIELD,
			DummyRelationEntity,
		);
		expect(relationMetadata.property).toBe("message");
		expect(relationMetadata.getValueFN).toBeInstanceOf(Function);
	});
});
