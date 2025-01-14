export { FactoryField } from "./decorators/factory-field.decorator";
export { FactoryRelationField } from "./decorators/factory-relation-field.decorator";
export { Factory } from "./lib/factory";
export { Overridable } from "./lib/overridable";
export declare class Photo {
    id: number;
    url: string;
    userId: number;
}
export declare class User {
    id: number;
    name: string;
    photo: Photo;
}
