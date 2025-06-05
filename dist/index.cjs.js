'use strict';

require('reflect-metadata');

const FACTORY_FIELD = Symbol("FACTORY_FIELD_METADATA");
const FACTORY_RELATION = Symbol("FACTORY_RELATION_METADATA");

function extendArrayMetadata(key, metadata, target) {
    const previousValue = Reflect.getMetadata(key, target) || [];
    const value = [...previousValue, ...metadata];
    Reflect.defineMetadata(key, value, target);
}

function resolvePath(entity, path) {
    if (!path || !entity) {
        return undefined;
    }
    let current = entity;
    let part = "";
    for (let i = 0; i <= path.length; i++) {
        const char = path[i];
        if (char === "." || i === path.length) {
            if (Array.isArray(current)) {
                const results = [];
                for (const item of current) {
                    if (item && item[part] !== undefined) {
                        results.push(item[part]);
                    }
                }
                current = results.length ? results : undefined;
            }
            else {
                if (current === undefined) {
                    return undefined;
                }
                current = current[part];
            }
            part = "";
        }
        else {
            part += char;
        }
    }
    return current;
}

function FactoryField(getValueFn) {
    return (target, propertyKey) => {
        const metadata = {
            property: propertyKey,
            getValueFN: getValueFn,
        };
        extendArrayMetadata(FACTORY_FIELD, [metadata], target.constructor);
    };
}

function FactoryRelationField(returnValueFN, keyBinding) {
    return (target, propertyKey) => {
        const factoryRelationMetadata = {
            property: propertyKey,
            returnTypeFn: returnValueFN,
            keyBinding,
        };
        extendArrayMetadata(FACTORY_RELATION, [factoryRelationMetadata], target.constructor);
    };
}

class Overridable {
    constructor(instance) {
        this.instance = instance;
    }
    override(override) {
        this.deepMerge(this.instance, override(this.instance));
        return this.instance;
    }
    getInstance() {
        return this.instance;
    }
    deepMerge(entity, override) {
        if (!override)
            return;
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
    mergeArray(entityArray, overrideArray) {
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

class OneFactory {
    constructor(factory, entity, select) {
        this.factory = factory;
        this.entity = entity;
        this.select = select;
    }
    override(overrideFn) {
        this.overrideFn = overrideFn;
        return this;
    }
    partial(select) {
        this.partialSelect = select;
        return this;
    }
    make() {
        let instance;
        if (this.partialSelect) {
            instance = this.factory.partial(this.entity, this.partialSelect);
        }
        else {
            instance = this.factory.new(this.entity, this.select);
        }
        if (this.overrideFn) {
            return new Overridable(instance).override(this.overrideFn);
        }
        return instance;
    }
    build() {
        return this.make();
    }
}
class ManyFactory {
    constructor(factory, entity, amount, select) {
        this.factory = factory;
        this.entity = entity;
        this.amount = amount;
        this.select = select;
    }
    override(overrideFn) {
        this.overrideFn = overrideFn;
        return this;
    }
    partial(select) {
        this.partialSelect = select;
        return this;
    }
    make() {
        let instances;
        if (this.partialSelect) {
            instances = new Array(this.amount).fill(null).map(() => this.factory.partial(this.entity, this.partialSelect));
        }
        else {
            instances = this.factory.newList(this.entity, this.amount, this.select);
        }
        if (this.overrideFn) {
            const overrides = this.overrideFn(instances);
            return instances.map((instance, index) => {
                if (index < overrides.length) {
                    return new Overridable(instance).override(() => overrides[index]);
                }
                return instance;
            });
        }
        return instances;
    }
    build() {
        return this.make();
    }
}
class Factory {
    constructor(fakerInstance) {
        this.faker = fakerInstance;
    }
    one(entity, select) {
        return new OneFactory(this, entity, select);
    }
    many(entity, amount, select) {
        return new ManyFactory(this, entity, amount, select);
    }
    create(entity, select) {
        return new Overridable(this.new(entity, select));
    }
    createList(entity, amount, select) {
        const entities = this.newList(entity, amount, select);
        return new Overridable(entities);
    }
    new(entity, select) {
        const instance = this.createInstance(entity, select);
        this.applyRelations(entity, instance, select);
        return instance;
    }
    newList(entity, amount, select) {
        return new Array(amount).fill(null).map(() => this.new(entity, select));
    }
    partial(entity, select) {
        const instance = this.createPartialInstance(entity, select);
        this.applyPartialRelations(entity, instance, select);
        return instance;
    }
    applyEntityRelations(entity, instance, select, isPartial = false) {
        const relationFieldMetadata = Reflect.getMetadata(FACTORY_RELATION, entity) || [];
        for (const meta of relationFieldMetadata) {
            const selectedField = select === null || select === void 0 ? void 0 : select[meta.property];
            if (selectedField) {
                const returnType = meta.returnTypeFn();
                const isRelationArray = Array.isArray(returnType);
                const relationType = isRelationArray ? returnType[0] : returnType;
                if (isRelationArray) {
                    const [instancesToCreate, relationSelect] = selectedField;
                    instance[meta.property] = new Array(instancesToCreate).fill(null).map(() => {
                        const relationInstance = isPartial
                            ? this.partial(relationType, relationSelect || {})
                            : this.new(relationType, relationSelect);
                        this.applyKeyBinding(meta, instance, relationInstance);
                        if (!isPartial) {
                            this.bindNestedRelations(relationInstance);
                        }
                        return relationInstance;
                    });
                    continue;
                }
                const relationInstance = isPartial
                    ? this.partial(relationType, selectedField)
                    : this.new(relationType, selectedField);
                this.applyKeyBinding(meta, instance, relationInstance);
                if (!isPartial) {
                    this.bindNestedRelations(relationInstance);
                }
                instance[meta.property] = relationInstance;
            }
        }
    }
    applyRelations(entity, instance, select) {
        this.applyEntityRelations(entity, instance, select, false);
    }
    applyKeyBinding(meta, parentInstance, relationInstance) {
        if (meta.keyBinding) {
            const parentValue = resolvePath(parentInstance, meta.keyBinding.key);
            if (parentValue !== undefined) {
                relationInstance[meta.keyBinding.inverseKey] = parentValue;
            }
        }
    }
    bindNestedRelations(relationInstance) {
        const nestedRelationMetadata = Reflect.getMetadata(FACTORY_RELATION, relationInstance.constructor) || [];
        for (const nestedMeta of nestedRelationMetadata) {
            const nestedField = relationInstance[nestedMeta.property];
            if (!nestedField)
                continue;
            if (Array.isArray(nestedField)) {
                for (const nested of nestedField) {
                    this.applyKeyBinding(nestedMeta, relationInstance, nested);
                }
            }
            else if (nestedField && typeof nestedField === "object") {
                this.applyKeyBinding(nestedMeta, relationInstance, nestedField);
            }
        }
    }
    createEntityInstance(entity, select, isPartial = false) {
        const instance = new entity();
        const fieldMetadata = Reflect.getMetadata(FACTORY_FIELD, entity) || [];
        for (const meta of fieldMetadata) {
            const fieldSelect = select === null || select === void 0 ? void 0 : select[meta.property];
            if (isPartial) {
                if (fieldSelect === true) {
                    instance[meta.property] = meta.getValueFN(this.faker);
                }
            }
            else {
                if (fieldSelect !== false) {
                    instance[meta.property] = meta.getValueFN(this.faker);
                }
            }
        }
        return instance;
    }
    createInstance(entity, select) {
        return this.createEntityInstance(entity, select, false);
    }
    createPartialInstance(entity, select) {
        return this.createEntityInstance(entity, select, true);
    }
    applyPartialRelations(entity, instance, select) {
        this.applyEntityRelations(entity, instance, select, true);
    }
}

exports.Factory = Factory;
exports.FactoryField = FactoryField;
exports.FactoryRelationField = FactoryRelationField;
exports.Overridable = Overridable;
//# sourceMappingURL=index.cjs.js.map
