# Decorated Factory
A factory decorators for creating objects with faker data
## Purpose

Decorated Factory is a tool for creating instances of classes, especially useful in testing scenarios where you need to generate data. 

It uses decorators to define how to generate data for each field of a class, also supports relationships between entities and arrays of entities. 

This project was inspired by the way queries are made in PrismaORM.

## Installation
```bash
npm i reflect-metadata
npm i decorated-factory @faker-js/faker -d
```

```bash
yarn add decorated-factory @faker-js/faker --dev
yarn add reflect-metadata
```


## Usage

### Basic Usage

To use the Factory utility, you first need to define a class and use the `@FactoryField` decorator to specify how to generate data for each field. The decorator takes a function that receives a `faker` instance and returns the generated data.

```typescript
class DummyEntity {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
  name: string;
}
```

Then, you can use the Factory utility to create instances of this class.

```typescript
const factory = new Factory(faker);
const dummyEntity = factory.new(DummyEntity);
```

### Relationships

The Factory utility also supports relationships between entities. You can use the `@FactoryRelationField` decorator to specify a related entity.

```typescript
class DummyRelationEntity {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
  name: string;
}

class DummyEntity {
  @FactoryRelationField(() => DummyRelationEntity)
  field: DummyRelationEntity;
}
```

Then, you can create an instance of the main entity, and the Factory utility will automatically create an instance of the related entity.

```typescript
const factory = new Factory(faker);
const dummyEntity = factory.new(DummyEntity, {
  field: true,
});
```

### Arrays

The Factory utility can also handle arrays of entities. You can specify an array of a certain entity in the `@FactoryRelationField` decorator.

```typescript
class DummyEntity {
  @FactoryRelationField(() => [DummyRelationEntity])
  field: DummyRelationEntity[];
}
```

Then, you can create an instance of the main entity, and the Factory utility will automatically create an array of instances of the related entity.

```typescript
const factory = new Factory(faker);
const dummyEntity = factory.new(DummyEntity, {
  field: [1],
});
```

You can also specify the instances of array relationships

```typescript
const factory = new Factory(faker);
const dummyEntity = factory.new(DummyEntity, {
  field: [1, {
      anotherField: true
  }],
});
```


### Difference between "new" and "create"

The `new` method of the Factory utility creates a new instance of a class, while the `create` method creates an instance of the `Overridable` class that wraps the original instance. The `Overridable` class provides a `override` method that allows you to override the values of the instance.

```typescript
const factory = new Factory(faker);
const overridable = factory.create(DummyEntity);
const dummyEntity = overridable.override(() => ({ name: 'Hello World' }));
```

In this example, the `name` field of the `DummyEntity` instance will be 'Hello World', regardless of the function provided in the `@FactoryField` decorator.

### Overriding

The `Overridable` class provides a way to override the values of an instance. You can use the `override` method and provide a function that returns an object with the fields to override. The function receives the current instance as a parameter.

```typescript
const overridable = factory.create(DummyEntity);
const dummyEntity = overridable.override((instance) => ({
  name: 'New Name',
}));
```

In this example, the `name` field of the `DummyEntity` instance will be 'New Name', regardless of the function provided in the `@FactoryField` decorator.

### Creating Lists of Entities

The Factory utility provides methods to create lists of entities, which can be useful for generating data for testing collections or arrays of objects.

#### newList Method

The `newList` method allows you to create a list of new instances of a class.

```typescript
const factory = new Factory(faker);
const amount = 3;
const dummyEntities = factory.newList(DummyEntity, amount);
expect(dummyEntities).toHaveLength(amount);
```

#### createList Method

The `createList` method allows you to create a `Overridable` instance of generated objects, which can then be overridden as needed.

```typescript
const factory = new Factory(faker);
const amount = 3;
const overridable = factory.createList(DummyEntity, amount);
expect(overridable).toBeInstanceOf(Overridable);
```
