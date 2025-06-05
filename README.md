# Decorated Factory
A factory tool for creating objects with faker data

## Purpose
Decorated Factory is a tool for creating instances of classes, especially useful in testing scenarios where you need to generate data.
It uses decorators to define how to generate data for each field of a class, also supports relationships between entities and arrays of entities.
This project was inspired by the way queries are made in [PrismaORM](https://www.prisma.io/orm).

## Installation
```bash
npm i reflect-metadata
npm i decorated-factory @faker-js/faker -d
```

```bash
yarn add decorated-factory @faker-js/faker --dev
yarn add reflect-metadata
```

## Basic Usage
Import reflect-metadata at the entry point of your application:

```typescript
import 'reflect-metadata';
// rest of your code...
```

Define a class with the `@FactoryField` decorator to specify how to generate data:

```typescript
class Product {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryField((faker) => faker.commerce.productName())
  name: string;
}
```
> Note: faker is only imported as a type in decorators, not in the production bundle.

Create instances using the Factory:

```typescript
const factory = new Factory(faker);
const product = factory.one(Product).make();
```

## Relationships

Use `@FactoryRelationField` to define relationships between entities:

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

Create an instance with the related entity:

```typescript
const factory = new Factory(faker);
const product = factory.one(Product).make({
  review: true,
});
```

## Key Binding

Key binding connects parent and child entities through related fields:

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

The parent's key automatically binds to the child's inverseKey:

```typescript
const factory = new Factory(faker);
const book = factory.one(Book).make({ chapter: true });

console.log(book.chapter.bookId === book.id); // true
```

## Arrays

Create arrays of related entities:

```typescript
class Product {
  @FactoryRelationField(() => [Review])
  reviews: Review[];
}
```

Specify the number of instances to create:

```typescript
const factory = new Factory(faker);
const product = factory.one(Product).make({
  reviews: [3], // Creates 3 reviews
});
```

Or create a specific number:

```typescript
const factory = new Factory(faker);
const product = factory.one(Product).make({
  reviews: [1], // Creates 1 review
});
```

## Creating Entities

Create a single entity:

```typescript
const factory = new Factory(faker);
const product = factory.one(Product).make();
```

Create multiple entities:

```typescript
const factory = new Factory(faker);
const products = factory.many(Product, 5).make();
```

## Overriding Properties

Override properties of a single entity:

```typescript
const product = factory.one(Product).override(instance => ({
  name: 'Hello World'
})).make();
```

Override properties of multiple entities:

```typescript
const products = factory.many(Product, 5).override(instances => 
  instances.map(instance => ({ name: 'Product ' + instance.id }))
).make();
```

Apply custom overrides to multiple entities:

```typescript
const amount = 3;
const products = factory.many(Product, amount)
  .override(instances => instances.map(instance => ({ name: 'Custom Name' })))
  .make();
```

## Partial Entities

Create entities with only specific fields:

```typescript
// Single partial entity
const user = factory.one(User).partial({
  id: true,
  firstName: true,
}).make();

// Multiple partial entities
const users = factory.many(User, 3).partial({
  id: true,
  firstName: true,
}).make();
```

Chain partial with override:

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

## Partial with Relations

Include specific fields from related entities:

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

// Create a user with only id and name, and a photo with only id and url
const user = factory.one(User).partial({
  id: true,
  name: true,
  photo: {
    id: true,
    url: true,
  },
}).make();
```

## Partial with Array Relations

Specify the number of array items and their fields:

```typescript
class User {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryRelationField(() => [Photo])
  photos: Photo[];
}

// Create a user with one photo that has only id and url
const user = factory.one(User).partial({
  id: true,
  photos: [
    1, // Create 1 photo
    {
      id: true,
      url: true,
    },
  ],
}).make();
```

## Key Binding in Partial Entities

When using partial with key binding, relationship fields are always included:

```typescript
class Comment {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryField((faker) => faker.lorem.sentence())
  text: string;

  @FactoryField((faker) => faker.number.int())
  photoId: number; // Will be included automatically
}

class Photo {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryField((faker) => faker.image.url())
  url: string;

  @FactoryField((faker) => faker.number.int())
  userId: number; // Will be included automatically

  @FactoryRelationField(() => [Comment], { key: "id", inverseKey: "photoId" })
  comments: Comment[];
}

class User {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryRelationField(() => [Photo], { key: "id", inverseKey: "userId" })
  photos: Photo[];
}

// Even though we only request specific fields, relationship fields are included
const partialUser = factory.one(User).partial({
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
}).make();
```

Example output:
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
          "photoId": 2 // Included automatically
        },
        {
          "id": 4,
          "text": "Depromo cura molestias accusamus utrum delibero cum voco deserunt ipsum.",
          "photoId": 2 // Included automatically
        }
      ],
      "userId": 1 // Included automatically
    }
  ]
}
```

## Deprecated Methods

Methods to be removed in the next major release:

- `new(entity, select?)` → Use `factory.one(entity).make()`
- `newList(entity, amount, select?)` → Use `factory.many(entity, amount).make()`
- `create(entity, select?)` → Use `factory.one(entity).override().make()`
- `createList(entity, amount, select?)` → Use `factory.many(entity, amount).override().make()`
- `partial(entity, select)` → Use `factory.one(entity).partial(select).make()` or `factory.many(entity, amount).partial(select).make()`
