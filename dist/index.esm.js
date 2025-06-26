import 'reflect-metadata';

const FACTORY_VALUE = Symbol("FACTORY_VALUE_METADATA");
const FACTORY_TYPE = Symbol("FACTORY_TYPE_METADATA");

class UUID {
}
class AutoIncrement {
}

class EntityBuilder {
    constructor({ faker, entity, plain = false }) {
        this.relations = new Map();
        this.exclusions = new Set();
        this.overrides = new Map();
        this.globalAutoCounters = new Map();
        this.localAutoCounters = new Map();
        this.currentRoot = null;
        this.faker = faker;
        this.entityType = entity;
        this.asPlain = plain;
    }
    with(amountOrPath, maybePath) {
        if (typeof amountOrPath === "number") {
            if (amountOrPath < 0) {
                throw new Error(`Amount supplied to .with() must be zero or positive, but got ${amountOrPath}`);
            }
            this.relations.set(maybePath, amountOrPath);
            return this;
        }
        this.relations.set(amountOrPath, undefined);
        return this;
    }
    without(path) {
        this.exclusions.add(path);
        return this;
    }
    set(path, value) {
        const parts = path.split(".");
        if (parts.length > 1) {
            const parent = parts.slice(0, -1).join(".");
            if (!this.hasRelation(parent)) {
                throw new Error(`Cannot override nested path "${path}" – missing .with("${parent}") call`);
            }
        }
        this.overrides.set(path, value);
        return this;
    }
    make(size) {
        const rootAmount = size !== null && size !== void 0 ? size : this.relations.get("__root__");
        if (typeof rootAmount === "number") {
            if (rootAmount < 0) {
                throw new Error(`Amount supplied to .make() must be zero or positive, but got ${rootAmount}`);
            }
            const list = [];
            for (let i = 0; i < rootAmount; i++) {
                list.push(this.spawnRoot());
            }
            return list;
        }
        return this.spawnRoot();
    }
    plain(size) {
        this.asPlain = true;
        return this.make(size);
    }
    spawnRoot() {
        const root = this.asPlain ? {} : new this.entityType();
        this.currentRoot = root;
        this.populate(root, this.entityType, "");
        return root;
    }
    spawnChild(entityType, path) {
        if (entityType === AutoIncrement) {
            return this.generateAutoIncrement(path);
        }
        if (BUILT_IN_TYPES.has(entityType)) {
            const valueGenerator = BUILT_IN_TYPES.get(entityType);
            return valueGenerator ? valueGenerator(this.faker) : null;
        }
        const instance = new entityType();
        this.populate(instance, entityType, path);
        return instance;
    }
    hasRelation(path) {
        for (const key of this.relations.keys()) {
            if (key === path)
                return true;
            if (key.startsWith(`${path}.`))
                return true;
        }
        return false;
    }
    populate(target, entityType, prefix) {
        var _a;
        for (const field of this.readFieldMeta(entityType)) {
            const full = prefix ? `${prefix}.${field.property}` : field.property;
            if (this.exclusions.has(full))
                continue;
            if (this.overrides.has(full)) {
                target[field.property] = this.overrides.get(full);
                continue;
            }
            const amount = this.relations.get(full);
            if (typeof amount === "number") {
                const items = [];
                for (let i = 0; i < amount; i++)
                    items.push(field.getValueFN(this.faker));
                target[field.property] = items;
                continue;
            }
            if (field.isArray) {
                const items = [];
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
            if (this.exclusions.has(full))
                continue;
            if (this.overrides.has(full)) {
                target[relation.property] = this.overrides.get(full);
                continue;
            }
            const returnType = relation.returnTypeFn();
            const actualType = Array.isArray(returnType) ? returnType[0] : returnType;
            const isBuiltInType = BUILT_IN_TYPES.has(actualType);
            if (!isBuiltInType && !this.hasRelation(full))
                continue;
            const asArray = Array.isArray(returnType);
            if (asArray && returnType[0] === AutoIncrement) {
                throw new Error("cannot generate an array of AutoIncrement values");
            }
            const count = (_a = this.relations.get(full)) !== null && _a !== void 0 ? _a : 1;
            if (asArray) {
                const childArr = [];
                const childType = returnType[0];
                for (let i = 0; i < count; i++) {
                    const child = this.spawnChild(childType, full);
                    this.bindKeys(target, child, relation);
                    childArr.push(child);
                }
                target[relation.property] = childArr;
                continue;
            }
            const child = this.spawnChild(returnType, full);
            this.bindKeys(target, child, relation);
            target[relation.property] = child;
        }
    }
    bindKeys(parent, child, meta) {
        const keyBinding = meta.keyBinding;
        if (!keyBinding)
            return;
        child[keyBinding.inverseKey] = parent[keyBinding.key];
    }
    readFieldMeta(entity) {
        return Reflect.getMetadata(FACTORY_VALUE, entity) || [];
    }
    readRelationMeta(entity) {
        return Reflect.getMetadata(FACTORY_TYPE, entity) || [];
    }
    generateAutoIncrement(fullPath) {
        var _a, _b;
        if (fullPath.includes(".")) {
            if (!this.currentRoot)
                throw new Error("No root context");
            let counters = this.localAutoCounters.get(this.currentRoot);
            if (!counters) {
                counters = new Map();
                this.localAutoCounters.set(this.currentRoot, counters);
            }
            const next = ((_a = counters.get(fullPath)) !== null && _a !== void 0 ? _a : 0) + 1;
            counters.set(fullPath, next);
            return next;
        }
        const next = ((_b = this.globalAutoCounters.get(fullPath)) !== null && _b !== void 0 ? _b : 0) + 1;
        this.globalAutoCounters.set(fullPath, next);
        return next;
    }
}
class Factory {
    constructor(faker) {
        this.fake = faker;
    }
    one(entity) {
        return new EntityBuilder({ faker: this.fake, entity });
    }
    many(entity) {
        const defaultAmount = 1;
        return new EntityBuilder({ faker: this.fake, entity }).with(defaultAmount, "__root__");
    }
}

const BUILT_IN_TYPES = new Map([
    [String, (faker) => faker.lorem.word({ length: { min: 6, max: 12 } })],
    [Number, (faker) => faker.number.int({ min: 1, max: 10000 })],
    [Boolean, (faker) => faker.datatype.boolean()],
    [Date, (faker) => faker.date.past()],
    [UUID, (faker) => faker.string.uuid()],
    [AutoIncrement, () => 0],
]);

function extendArrayMetadata(key, metadata, target) {
    const previousValue = Reflect.getMetadata(key, target) || [];
    const value = [...previousValue, ...metadata];
    Reflect.defineMetadata(key, value, target);
}

function FactoryValue(getValueFn, options) {
    return (target, propertyKey) => {
        const metadata = {
            property: propertyKey,
            getValueFN: getValueFn,
            isArray: options === null || options === void 0 ? void 0 : options.isArray,
        };
        extendArrayMetadata(FACTORY_VALUE, [metadata], target.constructor);
    };
}

function FactoryType(returnValueFN, keyBinding) {
    return (target, propertyKey) => {
        const factoryRelationMetadata = {
            property: propertyKey,
            returnTypeFn: returnValueFN,
            keyBinding,
        };
        extendArrayMetadata(FACTORY_TYPE, [factoryRelationMetadata], target.constructor);
    };
}

export { AutoIncrement, Factory, FactoryType, FactoryValue, UUID };
