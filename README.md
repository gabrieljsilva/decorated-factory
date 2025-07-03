# Decorated Factory

A **declarative**, **type‑safe** factory for generating realistic data in tests, fixtures and seeders – no hand‑written mocks, no hidden globals.

---

## Table of contents

* [Overview](#overview)
* [Installation](#installation)
* [Quick‑start](#quick-start)
* [Core concepts](#core-concepts)
* [Built‑in JavaScript types](#built-in-javascript-types)
* [Built‑in helpers](#built-in-helpers)
* [Generating instances](#generating-instances)
* [Defining relationships](#defining-relationships)
* [Nested graphs & circular refs](#nested-graphs--circular-refs)
* [Key binding (foreign keys)](#key-binding-foreign-keys)
* [Arrays & amounts](#arrays--amounts)
* [Overriding values with `set`](#overriding-values-with-set)
* [Excluding fields with `without`](#excluding-fields-with-without)
* [Plain vs class instances](#plain-vs-class-instances)
* [Error handling](#error-handling)
* [API reference](#api-reference)

---


## Overview

Decorated Factory combines **metadata decorators** with a **fluent builder** that creates objects _only when – and only as deep as – you request them_. It works with plain objects or class instances, supports complex relationships, and ships with helpers such as sequential IDs and UUIDs.

Why you might like it:

- **Static paths** - autocompletion for nested strings like `'photo.description'`.
- **Lazy relations** - nested objects are populated only after you call `.with()`.
- **Bring‑your‑own faker** - pass any `@faker-js/faker` instance & locale.
- **Works everywhere** - unit tests, integration tests, database seeders.

---

## Installation

```shell
npm i decorated-factory @faker-js/faker reflect-metadata -D
```
or
```shell
yarn add decorated-factory @faker-js/faker reflect-metadata --dev
```


---


## Quick‑start

```ts
import 'reflect-metadata';
import { fakerPT_BR } from '@faker-js/faker';
import { Factory, FactoryValue } from 'decorated-factory';

const factory = new Factory(fakerPT_BR);

class User {
  @FactoryValue(faker => faker.number.int({ min: 1, max: 1000 }))
  id: number;

  @FactoryValue(faker => faker.person.fullName())
  name: string;
}

const user = factory.one(User).make();
```

---

## Core concepts

| Concept                               | Description                                                                                                                                                                                         |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@FactoryValue(fn, opts?)`            | Decorates a property with a _supplier function_ that receives `faker` and returns a value. Pass `{ isArray: true }` to mark the field as an **array of primitives**.                                |
| `@FactoryType(() => T \| [T], opts?)` | Declares that a property is another entity (`T`) or an array of them (`[T]`). Supports ES primitives (`String`, `Number`, `Boolean`, `Date`) and **built‑in helpers** like `AutoIncrement`, `UUID`. |
| `Factory.one(Type)`                   | Starts a **builder** for a _single_ instance.                                                                                                                                                       |
| `Factory.many(Type)`                  | Starts a builder for an **array** (default length = 1).                                                                                                                                             |
| `.with(amount?, path)`                | Opt‑in to populate a relation or array. For arrays pass a count: `.with(5, 'photos')`. Works recursively with dot‑notation (`'photos.upload'`).                                                     |
| `.set(path, value)`                   | Overrides generated data – must be called _after_ any relevant `.with()`. Works on primitives, objects **and arrays**.                                                                              |
| `.without(path)`                      | Removes a property from the output (after `.with()` if nested).                                                                                                                                     |
| `.make(size?)`                        | Materialises the object(s) as **class instances**. For `many()` you can pass the final array size here.                                                                                             |
| `.plain(size?)`                       | Like `.make()` but returns **plain objects** – handy for JSON payloads.                                                                                                                             |

---

## Built‑in JavaScript types

Decorated Factory can generate sensible defaults for JavaScript primitives out of the box.

```ts
class Document {
  @FactoryType(() => String)
  title: string;

  @FactoryType(() => Number)
  version: number;

  @FactoryType(() => Boolean)
  isPublished: boolean;

  @FactoryType(() => Date)
  createdAt: Date;

  @FactoryType(() => [String])
  tags: string[];
}

const document = factory.one(Document).with(3, 'tags').make();
```

---

## Built‑in helpers

| Helper          | Produces                                            | Example                                |
| --------------- | --------------------------------------------------- | -------------------------------------- |
| `AutoIncrement` | Sequential integers starting at **1** (per builder) | `1, 2, 3…`                             |
| `UUID`          | RFC‑4122 **v4** UUID strings                        | `d7f3e429‑9d5b‑42f9‑b7de‑8ba0e50bc9f6` |

```ts
class Task {
  @FactoryType(() => AutoIncrement)
  id: number;

  @FactoryType(() => UUID)
  taskId: string;
}

const task = factory.one(Task).make();
```

---

## Generating instances

### Declaring fields

```ts
class User {
  @FactoryValue(faker => faker.number.int({ min: 1, max: 1000 }))
  id: number;

  @FactoryValue(faker => faker.person.fullName())
  name: string;
}

const singleUser = factory.one(User).make();
const fiveUsers = factory.many(User).make(5);
```

### Array fields of primitives

```ts
class User {
  @FactoryValue(faker => faker.number.int({ min: 1, max: 1000 }))
  id: number;

  @FactoryValue(faker => faker.person.fullName())
  name: string;

  @FactoryValue(faker => faker.lorem.word(), { isArray: true })
  tags: string[];
}

const userWithFiveTags = factory
  .one(User)
  .with(5, 'tags')
  .make();
```

---

## Defining relationships

### One‑to‑one

```ts
class Photo {
  @FactoryValue(faker => faker.image.url())
  url: string;
}

class User {
  @FactoryType(() => AutoIncrement)
  id: number;

  @FactoryValue(faker => faker.person.fullName())
  name: string;

  @FactoryType(() => Photo)
  photo: Photo;
}

const user = factory.one(User).with('photo').make();
```

### One‑to‑many

```ts
class Photo {
  @FactoryValue(faker => faker.image.url())
  url: string;
}

class User {
  @FactoryType(() => AutoIncrement)
  id: number;

  @FactoryValue(faker => faker.person.fullName())
  name: string;

  @FactoryType(() => [Photo])
  photos: Photo[];
}

const gallery = factory.one(User).with(5, 'photos').make();
```

---

## Nested graphs & circular refs

```ts
class Upload {
  @FactoryValue(faker => faker.image.url())
  url: string;
}

class Photo {
  @FactoryValue(faker => faker.lorem.sentence())
  description: string;

  @FactoryType(() => Upload)
  upload: Upload;
}

class User {
  @FactoryType(() => AutoIncrement)
  id: number;

  @FactoryValue(faker => faker.person.fullName())
  name: string;

  @FactoryType(() => [Photo])
  photos: Photo[];
}

const complexUser = factory
  .one(User)
  .with(3, 'photos')
  .with('photos.upload')
  .make();
```

```ts
class Tag {
  @FactoryValue(faker => faker.word.noun())
  name: string;
}

class Photo {
  @FactoryValue(faker => faker.image.url())
  url: string;

  @FactoryType(() => [Tag])
  tags: Tag[];
}

class User {
  @FactoryType(() => AutoIncrement)
  id: number;

  @FactoryValue(faker => faker.person.fullName())
  name: string;

  @FactoryType(() => [Photo])
  photos: Photo[];
}

const userWithTaggedPhotos = factory
  .one(User)
  .with(4, 'photos')
  .with(2, 'photos.tags')
  .make();
```

### Explicit circular reference

```ts
class User {
  @FactoryType(() => AutoIncrement)
  id: number;

  @FactoryValue(faker => faker.person.fullName())
  name: string;

  @FactoryType(() => Photo)
  photo: Photo;
}

class Photo {
  @FactoryType(() => AutoIncrement)
  id: number;

  @FactoryValue(faker => faker.image.url())
  url: string;

  @FactoryType(() => User)
  user: User;
}

const circular = factory
  .one(User)
  .with('photo')
  .with('photo.user')
  .make();
```

---

## Key binding (foreign keys)

```ts
class Photo {
  @FactoryValue(faker => faker.image.url())
  url: string;

  userId: number; // copied from parent User.id
}

class User {
  @FactoryType(() => AutoIncrement)
  id: number;

  @FactoryValue(faker => faker.person.fullName())
  name: string;

  @FactoryType(() => [Photo], { key: 'id', inverseKey: 'userId' })
  photos: Photo[];
}

const userWithPhotos = factory.one(User).with(5, 'photos').make();
```

Rules:

1. `key` must exist on the parent.
2. `inverseKey` must exist on the child.
3. Works for one‑to‑one **and** one‑to‑many.


---

## Arrays & amounts

|Call| Behaviour                                                       |
|---|-----------------------------------------------------------------|
|`.with(0, 'tags')`| Creates an **empty** array.                                     |
|`.with(-1, 'tags')`| **Throws** – amounts must be ≥ 0.                              |
|`.many(Type).make(n)`| Generates `n` root objects. `0` → `[]`; negative numbers throw. |

```ts
const emptyPhotosUser = factory.one(User).with(0, 'photos').make();
```

---

## Overriding values with `set`

```ts
const namedUser = factory.one(User)
  .set('name', 'John Doe')
  .make();
```

### Nested & array overrides

```ts
const modifiedDescriptions = factory.one(User)
  .with(5, 'photos')
  .set('photos.description', 'Same description for all photos')
  .make();
```

> Overriding a nested path without first requesting its parent relation throws an error to preventing silent mistakes.

---

## Excluding fields with `without`

```ts
const anonymousUser = factory
  .one(User)
  .without('name')
  .make();
```

### Excluding inside a relation

```ts
const userWithoutPhotoText = factory
  .one(User)
  .with('photo')
  .without('photo.description')
  .make();
```

---

## Plain vs class instances

`.make()` returns **class instances**; `.plain()` returns **plain objects** – perfect for HTTP payloads:

```ts
const payload = factory
  .one(User)
  .with(2, 'photos')
  .plain();
```

---

## Error handling

Decorated Factory fails fast with clear errors when you:

- Supply a negative amount to `.with()` or `.many().make()`.
- Call `set()` for a nested path without its parent `.with()`.
- Try to generate an **array** of `AutoIncrement` values (unsupported by design).


---

## API reference

```
Factory.one(Type)  // builder for one
Factory.many(Type) // builder for many
  .with(amount?, path)   // opt-in relations (any depth)
  .set(path, value)      // overrides (optional)
  .without(path)         // exclusions (optional)
  .make(size?) | .plain(size?)
```