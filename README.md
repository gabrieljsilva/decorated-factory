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
Ensure import reflect-metadata at the entry point of your application.

```typescript
import 'reflect-metadata';
// rest of your code...
```

To use the Factory utility, you first need to define a class and use the `@FactoryField` decorator to specify how to generate data for each field. The decorator takes a function that receives a `faker` instance and returns the generated data.


```typescript
class Product {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryField((faker) => faker.commerce.productName())
  name: string;
}
```
> PS: the faker is not imported in the production bundle, because the decorator import only the faker type.


Then, you can use the Factory utility to create instances of this class.

```typescript
const factory = new Factory(faker);
const product = factory.one(Product).make();
```

### Relationships

The Factory utility also supports relationships between entities. You can use the `@FactoryRelationField` decorator to specify a related entity.

```typescript
class Review {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryField((faker) => faker.lorem.sentence())
  content: string;
}

class Product {
  @FactoryRelationField(() => Review)
  review: Review;
}
```

Then, you can create an instance of the main entity, and the Factory utility will automatically create an instance of the related entity.

```typescript
const factory = new Factory(faker);
const product = factory.one(Product).make({
  review: true,
});
```

#### Key Binding

The `@FactoryRelationField` decorator supports key binding, which allows you to specify how a parent entity's field is related to a child entity's field. This is useful for scenarios like foreign key relationships in databases.

Here is how you can use it:

```typescript
class Chapter {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryField((faker) => faker.number.int())
  bookId: number;
}

class Book {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryRelationField(() => Chapter, {
    key: "id",
    inverseKey: "bookId",
  })
  chapter: Chapter;
}
```

When creating instances, the `key` from the parent will automatically bind to the `inverseKey` in the child:

```typescript
const factory = new Factory(faker);
const book = factory.one(Book).make({ chapter: true });

console.log(book.chapter.bookId === book.id); // true
```

### Arrays

The Factory utility can also handle arrays of entities. You can specify an array of a certain entity in the `@FactoryRelationField` decorator.

```typescript
class Product {
  @FactoryRelationField(() => [Review])
  reviews: Review[];
}
```

Then, you can create an instance of the main entity, and the Factory utility will automatically create an array of instances of the related entity.

```typescript
const factory = new Factory(faker);
const product = factory.one(Product).make({
  reviews: [3],
});
```

You can also specify the instances of array relationships

```typescript
const factory = new Factory(faker);
const product = factory.one(Product).make({
  reviews: [1],
});
```

### Creating Entities with the Factory API

The Factory API provides a fluent interface for creating entities with optional overrides.

#### Creating a Single Entity

The `one` method creates a factory for a single entity instance:

```typescript
const factory = new Factory(faker);
const product = factory.one(Product).make();
```

You can also override properties of the entity:

```typescript
const product = factory.one(Product).override(instance => ({
  name: 'Hello World'
})).make();
```

In this example, the `name` field of the `Product` instance will be 'Hello World', regardless of the function provided in the `@FactoryField` decorator.

#### Creating Multiple Entities

The `many` method creates a factory for multiple entity instances:

```typescript
const factory = new Factory(faker);
const products = factory.many(Product, 5).make();
```

You can also override properties of the entities:

```typescript
const products = factory.many(Product, 5).override(instances => 
  instances.map(instance => ({ name: 'Product ' + instance.id }))
).make();
```

### Overriding

The `override` method allows you to modify the generated entities before they are returned. The function receives the current instance(s) as a parameter and should return an object (or array of objects) with the fields to override.

```typescript
const product = factory.one(Product).override(instance => ({
  name: 'New Name',
})).make();
```

In this example, the `name` field of the `Product` instance will be 'New Name', regardless of the function provided in the `@FactoryField` decorator.

### Creating Lists of Entities

The Factory utility provides methods to create lists of entities, which can be useful for generating data for testing collections or arrays of objects.

#### Creating Multiple Entities

The `many` method allows you to create multiple instances of a class.

```typescript
const factory = new Factory(faker);
const amount = 3;
const products = factory.many(Product, amount).make();
expect(products).toHaveLength(amount); // true
```

You can also override properties of the entities:

```typescript
const factory = new Factory(faker);
const amount = 3;
const products = factory.many(Product, amount)
  .override(instances => instances.map(instance => ({ name: 'Custom Name' })))
  .make();
```

### Subset Selection with partial

The `partial` method allows you to create an instance of an entity with only a subset of its fields. This is useful when you only need specific fields of an entity for testing or other purposes.

#### Using the Builder Pattern

Use the builder pattern with `one()` and `many()` methods:

```typescript
// Create a single partial entity
const user = factory.one(User).partial({
  id: true,
  firstName: true,
}).make();

// Create multiple partial entities
const users = factory.many(User, 3).partial({
  id: true,
  firstName: true,
}).make();
```

You can also chain the `partial` method with `override`:

```typescript
const user = factory.one(User)
  .partial({
    id: true,
    firstName: true,
  })
  .override(() => ({
    firstName: 'Custom Name',
  }))
  .make();
```

In these examples, only the `id` and `firstName` fields will be generated, while `lastName` and `email` will be undefined.

#### Partial with Relations

The `partial` method also supports relationships between entities. You can specify which fields of the related entity should be included.

##### Using the Factory directly

```typescript
class Photo {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryField((faker) => faker.image.url())
  url: string;

  @FactoryField((faker) => faker.lorem.sentence())
  description: string;
}

class User {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryField((faker) => faker.person.fullName())
  name: string;

  @FactoryRelationField(() => Photo)
  photo: Photo;
}

const factory = new Factory(faker);
const partialUser = factory.partial(User, {
  id: true,
  name: true,
  photo: {
    id: true,
    url: true,
  },
});
```

##### Using the Builder Pattern

```typescript
const user = factory.one(User).partial({
  id: true,
  name: true,
  photo: {
    id: true,
    url: true,
  },
}).make();
```

In these examples, the `User` instance will have `id` and `name` fields, and a related `Photo` with only `id` and `url` fields.

#### Partial with Array Relations

The `partial` method also supports array relationships. You can specify the number of instances to create and which fields to include.

##### Using the Factory directly

```typescript
class User {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryRelationField(() => [Photo])
  photos: Photo[];
}

const factory = new Factory(faker);
const partialUser = factory.partial(User, {
  id: true,
  photos: [
    1,
    {
      id: true,
      url: true,
    },
  ],
});
```

##### Using the Builder Pattern

```typescript
const user = factory.one(User).partial({
  id: true,
  photos: [
    1,
    {
      id: true,
      url: true,
    },
  ],
}).make();
```

In these examples, the `User` instance will have an `id` field and an array with one `Photo` that only has `id` and `url` fields.

#### Key Binding in Partial Entities

When using the `partial` method with relations that have key binding, the key binding properties will ALWAYS be included in the output, even if you don't explicitly request them. This is necessary to maintain the relationship between entities.

For example:

```typescript
class Comment {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryField((faker) => faker.lorem.sentence())
  text: string;

  @FactoryField((faker) => faker.number.int())
  photoId: number;
}

class Photo {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryField((faker) => faker.image.url())
  url: string;

  @FactoryField((faker) => faker.number.int())
  userId: number;

  @FactoryRelationField(() => [Comment], { key: "id", inverseKey: "photoId" })
  comments: Comment[];
}

class User {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryRelationField(() => [Photo], { key: "id", inverseKey: "userId" })
  photos: Photo[];
}

const factory = new Factory(faker);
const partialUser = factory.partial(User, {
  id: true,
  photos: [
    1,
    {
      id: true,
      url: true,
      comments: [
        2,
        {
          id: true,
          text: true,
        },
      ],
    },
  ],
});
```

Even though we only requested `id`, `url`, `comments.id`, and `comments.text`, the output will also include `userId` in the Photo object and `photoId` in the Comment objects:

```json
{
  "id": 1,
  "photos": [
    {
      "id": 2,
      "url": "https://picsum.photos/seed/7ggB4tRnW/640/480",
      "comments": [
        {
          "id": 3,
          "text": "Degusto suffragium admoneo comminor quis suus urbs.",
          "photoId": 2
        },
        {
          "id": 4,
          "text": "Depromo cura molestias accusamus utrum delibero cum voco deserunt ipsum.",
          "photoId": 2
        }
      ],
      "userId": 1
    }
  ]
}
```

This is because the key binding properties (`userId` and `photoId`) are necessary to establish the relationships between the entities.

## Deprecated Methods

The following methods are deprecated and will be removed in the next major release:

### Factory Class

- `new(entity, select?)` - Use `factory.one(entity).make()` instead
- `newList(entity, amount, select?)` - Use `factory.many(entity, amount).make()` instead
- `create(entity, select?)` - Use `factory.one(entity).override().make()` instead
- `createList(entity, amount, select?)` - Use `factory.many(entity, amount).override().make()` instead
- `partial(entity, select)` - Use `factory.one(entity).partial(select).make()` or `factory.many(entity, amount).partial(select).make()` instead
