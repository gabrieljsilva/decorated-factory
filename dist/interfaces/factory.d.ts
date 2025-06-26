import type { Faker } from "@faker-js/faker";
import type { Type } from "./type";
export interface BuildOpts<T> {
    faker: Faker;
    entity: Type<T>;
    plain?: boolean;
}
