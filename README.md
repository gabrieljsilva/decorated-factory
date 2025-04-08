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
const product = factory.new(Product);
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
const product = factory.new(Product, {
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
const book = factory.new(Book, { chapter: true });

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
const product = factory.new(Product, {
  reviews: [3],
});
```

You can also specify the instances of array relationships

```typescript
const factory = new Factory(faker);
const product = factory.new(Product, {
  reviews: [1],
});
```

### Difference between "new" and "create"

The `new` method of the Factory utility creates a new instance of a class, while the `create` method creates an instance of the `Overridable` class that wraps the original instance. The `Overridable` class provides a `override` method that allows you to override the values of the instance.

```typescript
const factory = new Factory(faker);
const overridable = factory.create(Product);
const product = overridable.override(() => ({ name: 'Hello World' }));
```

In this example, the `name` field of the `Product` instance will be 'Hello World', regardless of the function provided in the `@FactoryField` decorator.

### Overriding

The `Overridable` class provides a way to override the values of an instance. You can use the `override` method and provide a function that returns an object with the fields to override. The function receives the current instance as a parameter.

```typescript
const overridable = factory.create(Product);
const product = overridable.override((instance) => ({
  name: 'New Name',
}));
```

In this example, the `name` field of the `Product` instance will be 'New Name', regardless of the function provided in the `@FactoryField` decorator.

### Creating Lists of Entities

The Factory utility provides methods to create lists of entities, which can be useful for generating data for testing collections or arrays of objects.

#### newList Method

The `newList` method allows you to create a list of new instances of a class.

```typescript
const factory = new Factory(faker);
const amount = 3;
const products = factory.newList(Product, amount);
expect(products).toHaveLength(amount);
```

#### createList Method

The `createList` method allows you to create a `Overridable` instance of generated objects, which can then be overridden as needed.

```typescript
const factory = new Factory(faker);
const amount = 3;
const overridable = factory.createList(Product, amount);
expect(overridable).toBeInstanceOf(Overridable);
```

### Subset Selection with partial

The `partial` method allows you to create an instance of an entity with only a subset of its fields. This is useful when you only need specific fields of an entity for testing or other purposes.

```typescript
class User {
  @FactoryField((faker) => faker.number.int())
  id: number;

  @FactoryField((faker) => faker.person.firstName())
  firstName: string;

  @FactoryField((faker) => faker.person.lastName())
  lastName: string;

  @FactoryField((faker) => faker.internet.email())
  email: string;
}

const factory = new Factory(faker);
const partialUser = factory.partial(User, {
  id: true,
  firstName: true,
});
```

In this example, only the `id` and `firstName` fields will be generated, while `lastName` and `email` will be undefined.

#### Partial with Relations

The `partial` method also supports relationships between entities. You can specify which fields of the related entity should be included.

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

In this example, the `User` instance will have `id` and `name` fields, and a related `Photo` with only `id` and `url` fields.

#### Partial with Array Relations

The `partial` method also supports array relationships. You can specify the number of instances to create and which fields to include.

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

In this example, the `User` instance will have an `id` field and an array with one `Photo` that only has `id` and `url` fields.

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
