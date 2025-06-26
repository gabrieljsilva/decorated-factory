import "reflect-metadata";
import { fakerPT_BR } from "@faker-js/faker";
import { validate, version } from "uuid";
import { FactoryType, FactoryValue } from "../decorators";
import { AutoIncrement, UUID } from "./built-in-types";
import { Factory } from "./factory";

describe("Factory tests", () => {
	const factory = new Factory(fakerPT_BR);

	it("should create an entity instance", () => {
		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;
		}

		const user = factory.one(User).make();

		expect(user).toBeInstanceOf(User);
		expect(user.id).toBeTypeOf("number");
		expect(user.name).toBeTypeOf("string");
	});

	it("should create a plain object", () => {
		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;
		}

		const user = factory.one(User).plain();

		expect(user).toBeInstanceOf(Object);
		expect(user.id).toBeTypeOf("number");
		expect(user.name).toBeTypeOf("string");
	});

	it("should create an entity with a one-to-one relation", () => {
		class Photo {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.image.url())
			url: string;

			@FactoryValue((faker) => faker.lorem.sentence())
			description: string;
		}

		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryType(() => Photo)
			photo: Photo;
		}

		const user = factory.one(User).with("photo").make();

		expect(user).toBeInstanceOf(User);
		expect(user.photo).toBeInstanceOf(Photo);
	});

	it("should create an entity with a nested one-to-one relation", () => {
		class Upload {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.image.url())
			url: string;
		}

		class Photo {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.lorem.sentence())
			description: string;

			@FactoryType(() => Upload)
			upload: Upload;
		}

		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryType(() => Photo)
			photo: Photo;
		}

		// Should create a single user with a photo with an upload
		const user = factory.one(User).with("photo.upload").make();

		expect(user).toBeInstanceOf(User);
		expect(user.photo).toBeInstanceOf(Photo);
		expect(user.photo.upload).toBeInstanceOf(Upload);
	});

	it("should create an entity with a one-to-many relation", () => {
		class Photo {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.image.url())
			url: string;

			@FactoryValue((faker) => faker.lorem.sentence())
			description: string;
		}

		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryType(() => [Photo])
			photos: Photo[];
		}

		// Should create a single user with 5 photos
		const user = factory.one(User).with(5, "photos").make();

		expect(user).toBeInstanceOf(User);
		for (const photo of user.photos) {
			expect(photo).toBeInstanceOf(Photo);
		}
	});

	it("should create an entity with nested one-to-many relations", () => {
		class Tag {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.word.noun())
			name: string;
		}

		class Photo {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.image.url())
			url: string;

			@FactoryValue((faker) => faker.lorem.sentence())
			description: string;

			@FactoryType(() => [Tag])
			tags: Tag[];
		}

		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryType(() => [Photo])
			photos: Photo[];
		}

		// Should create a single user with 5 photos with 3 tags each photo
		const user = factory.one(User).with(5, "photos").with(3, "photos.tags").make();

		expect(user).toBeInstanceOf(User);

		for (const photo of user.photos) {
			expect(photo).toBeInstanceOf(Photo);
			expect(photo.tags.length).toBe(3);
			for (const tag of photo.tags) {
				expect(tag).toBeInstanceOf(Tag);
			}
		}
	});

	it("should exclude a single field from the entity", () => {
		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;
		}

		// Should create a single user without a "name" field
		const user = factory.one(User).without("name").make();

		expect(user).toBeInstanceOf(User);
		expect(user.id).toBeTypeOf("number");
		expect(user.name).toBeUndefined();
	});

	it("should exclude a field from a nested relation", () => {
		class Photo {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.image.url())
			url: string;

			@FactoryValue((faker) => faker.lorem.sentence())
			description: string;
		}

		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryType(() => Photo)
			photo: Photo;
		}

		// Should create a single user with a photo, but without the photo's description
		const user = factory.one(User).with("photo").without("photo.description").make();

		expect(user).toBeInstanceOf(User);
		expect(user.photo).toBeInstanceOf(Photo);
		expect(user.photo.id).toBeTypeOf("number");
		expect(user.photo.url).toBeTypeOf("string");
		expect(user.photo.description).toBeUndefined();
	});

	it("should exclude a field from a nested array relation", () => {
		class Photo {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.image.url())
			url: string;

			@FactoryValue((faker) => faker.lorem.sentence())
			description: string;
		}

		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryType(() => [Photo])
			photos: Photo[];
		}

		// Should create a single user with 5 photos, but without the photo's description
		const user = factory.one(User).with(5, "photos").without("photos.description").make();

		expect(user).toBeInstanceOf(User);

		for (const photo of user.photos) {
			expect(photo).toBeInstanceOf(Photo);
			expect(photo.id).toBeTypeOf("number");
			expect(photo.url).toBeTypeOf("string");
			expect(photo.description).toBeUndefined();
		}
	});

	it("should create an entity with a one-to-one relation using key binding", () => {
		class Photo {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.image.url())
			url: string;

			@FactoryValue((faker) => faker.lorem.sentence())
			description: string;

			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			userId: number;
		}

		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryType(() => Photo, { key: "id", inverseKey: "userId" })
			photo: Photo;
		}

		// Should create a single user with a photo, where the photo's userId is bound to the user's id
		const user = factory.one(User).with("photo").make();

		expect(user).toBeInstanceOf(User);
		expect(user.photo).toBeInstanceOf(Photo);
		expect(user.photo.userId).toBe(user.id);
	});

	it("should create an entity with a one-to-many relation using key binding", () => {
		class Photo {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.image.url())
			url: string;

			@FactoryValue((faker) => faker.lorem.sentence())
			description: string;

			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			userId: number;
		}

		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryType(() => [Photo], { key: "id", inverseKey: "userId" })
			photos: Photo[];
		}

		// Should create a single user with 5 photos, where the photo's userId is bound to the user's id
		const user = factory.one(User).with(5, "photos").make();

		expect(user).toBeInstanceOf(User);
		for (const photo of user.photos) {
			expect(photo).toBeInstanceOf(Photo);
			expect(photo.userId).toBe(user.id);
		}
	});

	it("should handle circular references while building entities", () => {
		class Photo {
			@FactoryType(() => AutoIncrement)
			id: number;

			@FactoryValue((faker) => faker.image.url())
			url: string;

			@FactoryValue((faker) => faker.lorem.sentence())
			description: string;

			@FactoryType(() => User)
			user: User;
		}

		class User {
			@FactoryType(() => AutoIncrement)
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryType(() => Photo)
			photo: Photo;
		}

		// should create a single user with a photo with a user
		const user = factory.one(User).with("photo").with("photo.user").make();

		expect(user).toBeInstanceOf(User);
		expect(user.photo).toBeInstanceOf(Photo);
		expect(user.photo.user).toBeInstanceOf(User);
	});

	it("should create an entity with an array of primitive values", () => {
		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryValue((faker) => faker.lorem.word())
			tags: string[];
		}

		// set the number of tags to 5
		const user = factory.one(User).with(5, "tags").make();

		expect(user).toBeInstanceOf(User);
		expect(user.tags).toBeInstanceOf(Array);
		expect(user.tags.length).toBe(5);
		for (const tag of user.tags) {
			expect(tag).toBeTypeOf("string");
		}
	});

	it("should override a single field value", () => {
		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;
		}

		// Should create a single user with an overridden field "name" to "John Doe"
		const user = factory.one(User).set("name", "John Doe").make();

		expect(user).toBeInstanceOf(User);
		expect(user.id).toBeTypeOf("number");
		expect(user.name).toBe("John Doe");
	});

	it("should override a nested field value", () => {
		class Photo {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.image.url())
			url: string;

			@FactoryValue((faker) => faker.lorem.sentence())
			description: string;
		}

		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryType(() => Photo)
			photo: Photo;
		}

		// Should create a single user with an overridden field "photo.description" to "A beautiful photo"
		const user = factory.one(User).with("photo").set("photo.description", "A beautiful photo").make();

		expect(user).toBeInstanceOf(User);
		expect(user.id).toBeTypeOf("number");
		expect(user.photo.description).toBe("A beautiful photo");
	});

	it("should not override a nested field when the relation is undefined", () => {
		class Photo {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.image.url())
			url: string;

			@FactoryValue((faker) => faker.lorem.sentence())
			description: string;
		}

		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryType(() => Photo)
			photo: Photo;
		}

		try {
			factory.one(User).set("photo.description", "A beautiful photo").make();
			expect.fail("Expected an error to be thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
		}
	});

	it("should create multiple entities", () => {
		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;
		}

		// Should create an array with 5 users
		const users = factory.many(User).make(5);

		expect(users).toBeInstanceOf(Array);
		expect(users.length).toBe(5);
		for (const user of users) {
			expect(user).toBeInstanceOf(User);
			expect(user.id).toBeTypeOf("number");
			expect(user.name).toBeTypeOf("string");
		}
	});

	it("should create a default-size array of entities", () => {
		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;
		}

		// Should create an array with 1 user
		const users = factory.many(User).make(1);

		expect(users).toBeInstanceOf(Array);
		expect(users.length).toBe(1);
		for (const user of users) {
			expect(user).toBeInstanceOf(User);
			expect(user.id).toBeTypeOf("number");
			expect(user.name).toBeTypeOf("string");
		}
	});

	it("should create multiple entities each with a relation", () => {
		class Photo {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.image.url())
			url: string;

			@FactoryValue((faker) => faker.lorem.sentence())
			description: string;
		}

		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryType(() => Photo)
			photo: Photo;
		}

		const amount = 5;

		// Should create an array with 5 users
		const users = factory.many(User).with("photo").make(amount);

		expect(users).toBeInstanceOf(Array);
		expect(users.length).toBe(amount);
		for (const user of users) {
			expect(user).toBeInstanceOf(User);
			expect(user.id).toBeTypeOf("number");
			expect(user.name).toBeTypeOf("string");

			expect(user.photo).toBeInstanceOf(Photo);
			expect(user.photo.id).toBeTypeOf("number");
			expect(user.photo.url).toBeTypeOf("string");
			expect(user.photo.description).toBeTypeOf("string");
		}
	});

	it("should create multiple entities with relations using key binding", () => {
		class Photo {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.image.url())
			url: string;

			@FactoryValue((faker) => faker.lorem.sentence())
			description: string;

			userId: number;
		}

		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryType(() => Photo, { key: "id", inverseKey: "userId" })
			photo: Photo;
		}

		const amount = 5;

		// Should create an array with 5 users with key bindings
		const users = factory.many(User).with("photo").make(amount);

		expect(users).toBeInstanceOf(Array);
		expect(users.length).toBe(amount);

		for (const user of users) {
			expect(user).toBeInstanceOf(User);
			expect(user.id).toBeTypeOf("number");
			expect(user.name).toBeTypeOf("string");

			expect(user.photo).toBeInstanceOf(Photo);
			expect(user.photo.id).toBeTypeOf("number");
			expect(user.photo.url).toBeTypeOf("string");
			expect(user.photo.description).toBeTypeOf("string");

			expect(user.photo.userId).toBe(user.id);
		}
	});

	it("should create an entity with implicitly nested relations", () => {
		class Upload {}

		class Photo {
			@FactoryType(() => Upload)
			upload: Upload;
		}

		class User {
			@FactoryType(() => Photo)
			photo: Photo;
		}

		const user = factory.one(User).with("photo.upload").make();

		expect(user).toBeInstanceOf(User);
		expect(user.photo).toBeInstanceOf(Photo);
		expect(user.photo.upload).toBeInstanceOf(Upload);
	});

	it("should create an entity with an array field of defined length via isArray", () => {
		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryValue((faker) => faker.lorem.word(), { isArray: true })
			tags: string[];
		}

		const user = factory.one(User).with(5, "tags").make();

		expect(user).toBeInstanceOf(User);
		expect(user.tags).toBeInstanceOf(Array);
		expect(user.tags.length).toBe(5);
		for (const tag of user.tags) {
			expect(tag).toBeTypeOf("string");
		}
	});

	it("should create an entity with an array field of default length via isArray", () => {
		class User {
			@FactoryValue((faker) => faker.number.int({ min: 1, max: 1000 }))
			id: number;

			@FactoryValue((faker) => faker.person.fullName())
			name: string;

			@FactoryValue((faker) => faker.lorem.word(), { isArray: true })
			tags: string[];
		}

		const user = factory.one(User).make();

		expect(user).toBeInstanceOf(User);
		expect(user.tags).toBeInstanceOf(Array);
		expect(user.tags.length).toBe(1);
		expect(user.tags[0]).toBeTypeOf("string");
	});

	it("should create an entity with built-in type fields", () => {
		class User {
			@FactoryType(() => Number)
			id: number;

			@FactoryType(() => String)
			name: string;

			@FactoryType(() => Boolean)
			isActive: boolean;

			@FactoryType(() => Date)
			createdAt: Date;
		}

		const user = factory.one(User).make();

		expect(user).toBeInstanceOf(User);
		expect(user.id).toBeTypeOf("number");
		expect(user.name).toBeTypeOf("string");
		expect(user.isActive).toBeTypeOf("boolean");
		expect(user.createdAt).toBeInstanceOf(Date);
	});

	it("should generate a random uuid using built-in-types", () => {
		class User {
			@FactoryType(() => UUID)
			id: string;
		}

		const user = factory.one(User).make();

		expect(user).toBeInstanceOf(User);
		const isUUIDv4 = validate(user.id) && version(user.id) === 4;

		expect(isUUIDv4).toBe(true);
	});

	it("should generate auto generated int values for a single instance", () => {
		class User {
			@FactoryType(() => AutoIncrement)
			id: number;
		}

		const user = factory.one(User).make();

		expect(user).toBeInstanceOf(User);
		expect(user.id).toBe(1);
	});

	it("should generate auto generated int values for a multiple instances", () => {
		class User {
			@FactoryType(() => AutoIncrement)
			id: number;
		}

		const amount = 5;
		const users = factory.many(User).make(amount);

		users.forEach((user, index) => {
			const id = index + 1;

			expect(user).toBeInstanceOf(User);
			expect(user.id).toBe(id);
		});
	});

	it("should generate auto generated int values for nested relations", () => {
		class Photo {
			@FactoryType(() => AutoIncrement)
			id: number;
		}

		class User {
			@FactoryType(() => AutoIncrement)
			id: number;

			@FactoryType(() => [Photo])
			photos: Photo[];
		}

		const amountOfUsers = 5;
		const amountOfPhotos = 3;
		const users = factory.many(User).with(amountOfPhotos, "photos").make(amountOfUsers);

		users.forEach((user, index) => {
			const id = index + 1;

			expect(user).toBeInstanceOf(User);
			expect(user.id).toBe(id);

			user.photos.forEach((photo, photoIndex) => {
				const photoId = photoIndex + 1;

				expect(photo).toBeInstanceOf(Photo);
				expect(photo.id).toBe(photoId);
			});
		});
	});

	it("should throw and error when tries to generated an array using AutoIncrement type", () => {
		class User {
			@FactoryType(() => [AutoIncrement])
			id: number;
		}

		try {
			factory.one(User).make();
			expect.fail("Expected an error to be thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe("cannot generate an array of AutoIncrement values");
		}
	});

	it("Generates Correct IDs in Deep Nested Arrays (Blog → Posts → Comments)", () => {
		class Comment {
			@FactoryType(() => AutoIncrement)
			id: number;
		}

		class Post {
			@FactoryType(() => AutoIncrement)
			id: number;

			@FactoryType(() => [Comment])
			comments: Comment[];
		}

		class Blog {
			@FactoryType(() => AutoIncrement)
			id: number;

			@FactoryType(() => [Post])
			posts: Post[];
		}

		const blogs = factory.many(Blog).with(2, "posts").with(4, "posts.comments").make(3);

		blogs.forEach((blog, index) => {
			expect(blog.id).toBe(index + 1);

			let commentCounter = 0;

			blog.posts.forEach((post, postIndex) => {
				expect(post.id).toBe(postIndex + 1);

				for (const comment of post.comments) {
					commentCounter += 1;
					expect(comment.id).toBe(commentCounter);
				}
			});
		});
	});

	it("plain() Preserves AutoIncrement Values in Nested Structures", () => {
		class Leaf {
			@FactoryType(() => AutoIncrement)
			id: number;
		}
		class Branch {
			@FactoryType(() => AutoIncrement)
			id: number;

			@FactoryType(() => [Leaf])
			leaves: Leaf[];
		}
		class Tree {
			@FactoryType(() => AutoIncrement)
			id: number;

			@FactoryType(() => [Branch])
			branches: Branch[];
		}

		// one tree with 3 branches with 2 leaves each
		const tree = factory.one(Tree).with(3, "branches").with(2, "branches.leaves").plain();

		expect(tree).toBeInstanceOf(Object);
		expect(tree.id).toBe(1);

		let leafCounter = 0;

		tree.branches.forEach((branch, index) => {
			expect(branch.id).toBe(index + 1);

			for (const leaf of branch.leaves) {
				leafCounter += 1;
				expect(leaf.id).toBe(leafCounter);
			}
		});
	});

	it("AutoIncrement Counters Restart for Each Independent EntityBuilder", () => {
		class User {
			@FactoryType(() => AutoIncrement)
			id: number;
		}

		const first = factory.one(User).make();
		const second = factory.one(User).make();

		expect(first.id).toBe(1);
		expect(second.id).toBe(1);
		expect(first).not.toBe(second);
	});

	it("Root AutoIncrement ID with Child Task Array Mixing AutoIncrement IDs and UUIDs", () => {
		class Task {
			@FactoryType(() => AutoIncrement)
			id: number;

			@FactoryType(() => UUID)
			taskId: string;
		}

		class Project {
			@FactoryType(() => AutoIncrement)
			id: number;

			@FactoryType(() => [Task])
			tasks: Task[];
		}

		const projects = factory.many(Project).with(7, "tasks").make(2);

		projects.forEach((project, index) => {
			expect(project.id).toBe(index + 1);

			project.tasks.forEach((task, taskIndex) => {
				expect(task.id).toBe(taskIndex + 1);
				expect(validate(task.taskId) && version(task.taskId) === 4).toBe(true);
			});
		});
	});

	it("should allow overriding an array field of primitive values", () => {
		class User {
			@FactoryValue((faker) => faker.lorem.word(), { isArray: true })
			tags: string[];
		}

		const customTags = ["alpha", "beta", "gamma"];
		const user = factory.one(User).set("tags", customTags).make();

		expect(user).toBeInstanceOf(User);
		expect(user.tags).toEqual(customTags);
	});

	it("should exclude an entire nested relation after it was included", () => {
		class Photo {
			@FactoryValue((faker) => faker.image.url())
			url: string;
		}

		class User {
			@FactoryType(() => Photo)
			photo: Photo;
		}

		// include the relation, then remove it
		const user = factory.one(User).with("photo").without("photo").make();

		expect(user).toBeInstanceOf(User);
		expect(user.photo).toBeUndefined();
	});

	it("keeps AutoIncrement counters independent across different entity types", () => {
		class Comment {
			@FactoryType(() => AutoIncrement)
			id: number;
		}

		class Post {
			@FactoryType(() => AutoIncrement)
			id: number;
		}

		const firstComment = factory.one(Comment).make();
		const firstPost = factory.one(Post).make();

		expect(firstComment.id).toBe(1);
		expect(firstPost.id).toBe(1);
	});

	it("creates an entity with an array of strings using FactoryType", () => {
		class User {
			@FactoryType(() => [String])
			tags: string[];
		}

		const user = factory.one(User).with(4, "tags").make();

		expect(user).toBeInstanceOf(User);
		expect(user.tags).toBeInstanceOf(Array);
		expect(user.tags.length).toBe(4);
		for (const tag of user.tags) {
			expect(typeof tag).toBe("string");
		}
	});

	it("returns an empty array when amount is zero", () => {
		class User {
			@FactoryValue((f) => f.number.int({ min: 1, max: 1000 }))
			id!: number;
		}

		const users = factory.many(User).make(0);

		expect(users).toEqual([]);
	});

	it("creates an entity whose array relation is explicitly zero-length", () => {
		class Photo {}
		class User {
			@FactoryType(() => [Photo])
			photos!: Photo[];
		}

		const user = factory.one(User).with(0, "photos").make();

		expect(user.photos).toEqual([]);
	});

	it("throws when a negative amount is supplied to with()", () => {
		class Tag {
			@FactoryValue((f) => f.word.noun())
			name: string;
		}
		class Post {
			@FactoryType(() => [Tag])
			tags: Tag[];
		}

		const amount = -3;

		try {
			factory.one(Post).with(amount, "tags").make();
			expect.fail("Expected an error to be thrown");
		} catch (error) {
			expect(error).instanceof(Error);
			expect(error.message).toBe(`Amount supplied to .with() must be zero or positive, but got ${amount}`);
		}
	});

	it("throws when a negative amount is supplied to many().make()", () => {
		class User {
			@FactoryValue((f) => f.person.fullName())
			name: string;
		}

		const amount = -5;

		try {
			factory.many(User).make(amount);
			expect.fail("Expected an error to be thrown");
		} catch (error) {
			expect(error).instanceof(Error);
			expect(error.message).toBe(`Amount supplied to .make() must be zero or positive, but got ${amount}`);
		}
	});

	it("allows overriding an AutoIncrement field value explicitly", () => {
		class User {
			@FactoryType(() => AutoIncrement)
			id: number;
		}

		const user = factory.one(User).set("id", 99).make();

		expect(user.id).toBe(99);
	});

	it("keeps values like after generation", () => {
		class Product {
			@FactoryValue(() => "R5 5600G")
			description: string;
		}

		const product = factory.one(Product).make();

		expect(product.description).toBe("R5 5600G");
	});

	it("set() after with() on an array overrides the generated contents", () => {
		class User {
			@FactoryValue((f) => f.lorem.word(), { isArray: true })
			tags: string[];
		}

		const user = factory.one(User).with(5, "tags").set("tags", ["one", "two"]).make();

		expect(user.tags).toEqual(["one", "two"]);
	});
});
