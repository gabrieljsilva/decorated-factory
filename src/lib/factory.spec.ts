import "reflect-metadata";
import { faker } from "@faker-js/faker";
import { FactoryField, FactoryRelationField } from "../decorators";
import { Factory } from "./factory";
import { Overridable } from "./overridable";

describe("Factory tests", () => {
	it("should create an entity", () => {
		class Cat {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);

		const cat = factory.new(Cat);
		expect(cat).toBeInstanceOf(Cat);
		expect(typeof cat.id).toBe("number");
		expect(typeof cat.name).toBe("string");
	});

	it("should create an entity with override", () => {
		const catId = 1;
		class Cat {
			@FactoryField(() => catId)
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);
		const cat = factory.create(Cat).override(() => ({ name: "Hello World" }));

		expect(cat).toBeInstanceOf(Cat);
		expect(cat.name).toBe("Hello World");
		expect(cat.id).toBe(catId);
	});

	it("should inject faker instance", () => {
		const factory = new Factory(faker);
		expect(factory).toHaveProperty("faker");
	});

	it("should create an entity with relation", () => {
		class Dog {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		class Cat {
			@FactoryRelationField(() => Dog)
			field: Dog;
		}

		const factory = new Factory(faker);
		const cat = factory.new(Cat, {
			field: true,
		});

		expect(cat).toBeInstanceOf(Cat);
		expect(cat.field).toBeInstanceOf(Dog);
	});

	it("should create an entity with relation array", () => {
		class Dog {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		class Cat {
			@FactoryRelationField(() => [Dog])
			field: Dog[];
		}

		const factory = new Factory(faker);
		const cat = factory.new(Cat, {
			field: [1],
		});

		expect(cat).toBeInstanceOf(Cat);
		expect(Array.isArray(cat.field)).toBeTruthy();
		expect(cat.field[0]).toBeInstanceOf(Dog);
	});

	it("should create an entity with relation array with override", () => {
		class Dog {
			@FactoryField((faker) => faker.number.int({ min: 999, max: 999999 }))
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		class Cat {
			@FactoryRelationField(() => [Dog])
			field: Dog[];
		}

		const factory = new Factory(faker);
		const cat = factory
			.create(Cat, {
				field: [1],
			})
			.override(() => ({
				field: [{ name: "Hello World" }],
			}));

		expect(cat).toBeInstanceOf(Cat);
		expect(Array.isArray(cat.field)).toBeTruthy();
		expect(cat.field[0]).toBeInstanceOf(Dog);
		expect(cat.field[0].name).toBe("Hello World");
	});

	it("should replace a value to null", () => {
		class Cat {
			@FactoryField(() => 1)
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);

		const cat = factory.create(Cat).override(() => ({
			name: null,
		}));

		expect(cat).toBeInstanceOf(Cat);
		expect(cat.name).toBeNull();
	});

	it("should create an entity with relation and replace relation value to null", () => {
		class Dog {
			@FactoryField((faker) => faker.number.int({ min: 999, max: 999999 }))
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		class Cat {
			@FactoryRelationField(() => [Dog])
			field: Dog[];
		}

		const factory = new Factory(faker);
		const cat = factory
			.create(Cat, {
				field: [1],
			})
			.override(() => ({
				field: [{ name: null }],
			}));

		expect(cat).toBeInstanceOf(Cat);
		expect(Array.isArray(cat.field)).toBeTruthy();
		expect(cat.field[0]).toBeInstanceOf(Dog);
		expect(cat.field[0].name).toBeNull();
	});

	it("should instantiate a list of entities", () => {
		class Cat {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);
		const amount = 3;
		const cats = factory.newList(Cat, amount);
		expect(cats).toHaveLength(amount);
	});

	it("should create list of overridable entities", () => {
		class Cat {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);
		const amount = 3;
		const overridable = factory.createList(Cat, amount);
		expect(overridable).toBeInstanceOf(Overridable);
	});

	it("should return the instance", () => {
		class Cat {
			id: number;
			name: string;
		}

		const catInstance = new Cat();
		catInstance.id = 1;
		catInstance.name = "Test Name";

		const overridable = new Overridable(catInstance);
		const instance = overridable.getInstance();

		expect(instance).toBe(catInstance);
		expect(instance.id).toBe(1);
		expect(instance.name).toBe("Test Name");
	});

	it("should override a field to null", () => {
		class Cat {
			@FactoryField(() => 1)
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);
		const cat = factory.create(Cat).override(() => ({
			name: null,
		}));

		expect(cat).toBeInstanceOf(Cat);
		expect(cat.name).toBeNull();
	});

	it("should correctly bind ids in basic nested relations", () => {
		class Comment {
			@FactoryField((faker) => faker.number.int({ min: 1, max: 100000 }))
			id: number;

			@FactoryField((faker) => faker.lorem.sentence())
			text: string;

			@FactoryField((faker) => faker.number.int())
			postId: number;
		}

		class Post {
			@FactoryField((faker) => faker.number.int({ min: 1, max: 100000 }))
			id: number;

			@FactoryField((faker) => faker.lorem.sentence())
			title: string;

			@FactoryRelationField(() => [Comment], { key: "id", inverseKey: "postId" })
			comments: Comment[];
		}

		class Category {
			@FactoryField((faker) => faker.number.int({ min: 1, max: 100000 }))
			id: number;

			@FactoryField((faker) => faker.lorem.word())
			name: string;
		}

		class CategoryPost {
			@FactoryField((faker) => faker.number.int({ min: 1, max: 100000 }))
			id: number;

			@FactoryField((faker) => faker.number.int({ min: 1, max: 100000 }))
			postId: number;

			@FactoryField((faker) => faker.number.int({ min: 1, max: 100000 }))
			categoryId: number;

			@FactoryRelationField(() => Category, { key: "categoryId", inverseKey: "id" })
			category: Category;

			@FactoryRelationField(() => Post, { key: "postId", inverseKey: "id" })
			post: Post;
		}

		const factory = new Factory(faker);

		const categoryPosts = factory.newList(CategoryPost, 3, {
			category: true,
			post: {
				comments: [3],
			},
		});

		expect(categoryPosts).toHaveLength(3);

		for (const categoryPost of categoryPosts) {
			expect(categoryPost.category.id).toBe(categoryPost.categoryId);
			expect(categoryPost.post.id).toBe(categoryPost.postId);

			for (const comment of categoryPost.post.comments) {
				expect(comment.postId).toBe(categoryPost.post.id);
			}
		}
	});

	it("should maintain consistency when overriding nested fields", () => {
		class Comment {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.sentence())
			text: string;

			@FactoryField((faker) => faker.number.int())
			postId: number;
		}

		class Post {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.sentence())
			title: string;

			@FactoryRelationField(() => [Comment], { key: "id", inverseKey: "postId" })
			comments: Comment[];
		}

		class CategoryPost {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.number.int())
			postId: number;

			@FactoryRelationField(() => Post, { key: "postId", inverseKey: "id" })
			post: Post;
		}

		const factory = new Factory(faker);

		const categoryPost = factory
			.create(CategoryPost, {
				post: {
					comments: [2],
				},
			})
			.override(() => ({
				post: {
					title: "Custom Post Title",
					comments: [{ text: "Custom Comment" }],
				},
			}));

		expect(categoryPost.post.title).toBe("Custom Post Title");
		expect(categoryPost.post.id).toBe(categoryPost.postId);
		expect(categoryPost.post.comments[0].text).toBe("Custom Comment");
		expect(categoryPost.post.comments[0].postId).toBe(categoryPost.post.id);
	});

	it("should handle deeply nested relations", () => {
		class Tag {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.number.int())
			commentId: number;

			@FactoryField((faker) => faker.lorem.word())
			name: string;
		}

		class Comment {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.sentence())
			text: string;

			@FactoryField((faker) => faker.number.int())
			postId: number;

			@FactoryRelationField(() => [Tag], { key: "id", inverseKey: "commentId" })
			tags: Tag[];
		}

		class Post {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.sentence())
			title: string;

			@FactoryRelationField(() => [Comment], { key: "id", inverseKey: "postId" })
			comments: Comment[];
		}

		class CategoryPost {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.number.int())
			postId: number;

			@FactoryRelationField(() => Post, { key: "postId", inverseKey: "id" })
			post: Post;
		}

		const factory = new Factory(faker);

		const instance = factory.new(CategoryPost, {
			post: {
				comments: [
					2,
					{
						tags: [2],
					},
				],
			},
		});

		expect(instance.post.id).toBe(instance.postId);
		for (const comment of instance.post.comments) {
			expect(comment.postId).toBe(instance.post.id);
			if (comment.tags) {
				for (const tag of comment.tags) {
					expect(tag.commentId).toBe(comment.id);
				}
			}
		}
	});

	it("should handle array-only nested relations", () => {
		class Comment {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.sentence())
			text: string;

			@FactoryField((faker) => faker.number.int())
			postId: number;
		}

		class Post {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryRelationField(() => [Comment], { key: "id", inverseKey: "postId" })
			comments: Comment[];
		}

		const factory = new Factory(faker);

		const post = factory.new(Post, {
			comments: [5],
		});

		expect(post.comments).toHaveLength(5);
		for (const comment of post.comments) {
			expect(comment.postId).toBe(post.id);
		}
	});

	it("should handle multiple independent relations", () => {
		class Author {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.number.int())
			postId: number;
		}

		class Comment {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.number.int())
			postId: number;
		}

		class Post {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryRelationField(() => [Comment], { key: "id", inverseKey: "postId" })
			comments: Comment[];

			@FactoryRelationField(() => [Author], { key: "id", inverseKey: "postId" })
			authors: Author[];
		}

		const factory = new Factory(faker);
		const post = factory.new(Post, {
			comments: [2],
			authors: [3],
		});

		expect(post.comments).toHaveLength(2);
		expect(post.authors).toHaveLength(3);

		for (const comment of post.comments) {
			expect(comment.postId).toBe(post.id);
		}

		for (const author of post.authors) {
			expect(author.postId).toBe(post.id);
		}
	});

	it("should create a partial entity with only selected fields", () => {
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

		expect(partialUser).toHaveProperty("id");
		expect(partialUser).toHaveProperty("firstName");
		expect(partialUser).not.toHaveProperty("lastName");
		expect(partialUser).not.toHaveProperty("email");
		expect(typeof partialUser.id).toBe("number");
		expect(typeof partialUser.firstName).toBe("string");
	});

	it("should create a partial entity with relations", () => {
		class Photo {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.image.url())
			url: string;

			@FactoryField((faker) => faker.lorem.sentence())
			description: string;

			@FactoryField((faker) => faker.number.int())
			userId: number;
		}

		class User {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.person.fullName())
			name: string;

			@FactoryRelationField(() => Photo, { key: "id", inverseKey: "userId" })
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

		expect(partialUser).toHaveProperty("id");
		expect(partialUser).toHaveProperty("name");
		expect(partialUser).toHaveProperty("photo");
		expect(partialUser.photo).toHaveProperty("id");
		expect(partialUser.photo).toHaveProperty("url");
		expect(partialUser.photo).not.toHaveProperty("description");
		expect(typeof partialUser.id).toBe("number");
		expect(typeof partialUser.name).toBe("string");
		expect(typeof partialUser.photo.id).toBe("number");
		expect(typeof partialUser.photo.url).toBe("string");
		expect(partialUser.photo.userId).toBe(partialUser.id);
	});

	it("should create a partial entity with array relations", () => {
		class Photo {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.image.url())
			url: string;

			@FactoryField((faker) => faker.lorem.sentence())
			description: string;

			@FactoryField((faker) => faker.number.int())
			userId: number;
		}

		class User {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.person.fullName())
			name: string;

			@FactoryRelationField(() => [Photo], { key: "id", inverseKey: "userId" })
			photos: Photo[];
		}

		const factory = new Factory(faker);
		const partialUser = factory.partial(User, {
			id: true,
			name: true,
			photos: [
				1,
				{
					id: true,
					url: true,
				},
			],
		});

		expect(partialUser).toHaveProperty("id");
		expect(partialUser).toHaveProperty("name");
		expect(partialUser).toHaveProperty("photos");
		expect(Array.isArray(partialUser.photos)).toBeTruthy();
		expect(partialUser.photos).toHaveLength(1);
		expect(partialUser.photos[0]).toHaveProperty("id");
		expect(partialUser.photos[0]).toHaveProperty("url");
		expect(partialUser.photos[0]).not.toHaveProperty("description");
		expect(typeof partialUser.id).toBe("number");
		expect(typeof partialUser.name).toBe("string");
		expect(typeof partialUser.photos[0].id).toBe("number");
		expect(typeof partialUser.photos[0].url).toBe("string");
		expect(partialUser.photos[0].userId).toBe(partialUser.id);
	});

	it("should handle nested relations in partial entities", () => {
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

			@FactoryField((faker) => faker.lorem.sentence())
			description: string;

			@FactoryField((faker) => faker.number.int())
			userId: number;

			@FactoryRelationField(() => [Comment], { key: "id", inverseKey: "photoId" })
			comments: Comment[];
		}

		class User {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.person.fullName())
			name: string;

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

		expect(partialUser).toHaveProperty("id");
		expect(partialUser).not.toHaveProperty("name");
		expect(partialUser).toHaveProperty("photos");
		expect(partialUser.photos).toHaveLength(1);
		expect(partialUser.photos[0]).toHaveProperty("id");
		expect(partialUser.photos[0]).toHaveProperty("url");
		expect(partialUser.photos[0]).not.toHaveProperty("description");
		expect(partialUser.photos[0]).toHaveProperty("comments");
		expect(partialUser.photos[0].comments).toHaveLength(2);
		expect(partialUser.photos[0].comments[0]).toHaveProperty("id");
		expect(partialUser.photos[0].comments[0]).toHaveProperty("text");
		expect(partialUser.photos[0].userId).toBe(partialUser.id);
		expect(partialUser.photos[0].comments[0].photoId).toBe(partialUser.photos[0].id);
	});

	it("should handle empty selection object", () => {
		class User {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.person.firstName())
			firstName: string;
		}

		const factory = new Factory(faker);
		const partialUser = factory.partial(User, {});

		expect(partialUser).not.toHaveProperty("id");
		expect(partialUser).not.toHaveProperty("firstName");
		expect(Object.keys(partialUser).length).toBe(0);
	});

	it("should ignore non-existent fields in selection", () => {
		class User {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.person.firstName())
			firstName: string;
		}

		const factory = new Factory(faker);
		const partialUser = factory.partial(User, {
			id: true,
			nonExistentField: true,
		} as any);

		expect(partialUser).toHaveProperty("id");
		expect(partialUser).not.toHaveProperty("firstName");
		expect(partialUser).not.toHaveProperty("nonExistentField");
		expect(Object.keys(partialUser).length).toBe(1);
	});

	it("should handle circular references in relations", () => {
		class Parent {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.person.fullName())
			name: string;

			@FactoryRelationField(() => Child, { key: "id", inverseKey: "parentId" })
			child: Child;
		}

		class Child {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.person.fullName())
			name: string;

			@FactoryField((faker) => faker.number.int())
			parentId: number;

			@FactoryRelationField(() => Parent, { key: "parentId", inverseKey: "id" })
			parent: Parent;
		}

		const factory = new Factory(faker);
		const partialParent = factory.partial(Parent, {
			id: true,
			name: true,
			child: {
				id: true,
				name: true,
			},
		});

		expect(partialParent).toHaveProperty("id");
		expect(partialParent).toHaveProperty("name");
		expect(partialParent).toHaveProperty("child");
		expect(partialParent.child).toHaveProperty("id");
		expect(partialParent.child).toHaveProperty("name");
		expect(partialParent.child).not.toHaveProperty("parent");
		expect(partialParent.child.parentId).toBe(partialParent.id);
	});

	it("should handle complex nested structures with multiple levels", () => {
		class GrandChild {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.person.fullName())
			name: string;

			@FactoryField((faker) => faker.number.int())
			childId: number;
		}

		class Child {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.person.fullName())
			name: string;

			@FactoryField((faker) => faker.number.int())
			parentId: number;

			@FactoryRelationField(() => [GrandChild], { key: "id", inverseKey: "childId" })
			grandChildren: GrandChild[];
		}

		class Parent {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.person.fullName())
			name: string;

			@FactoryRelationField(() => [Child], { key: "id", inverseKey: "parentId" })
			children: Child[];
		}

		const factory = new Factory(faker);
		const partialParent = factory.partial(Parent, {
			id: true,
			name: true,
			children: [
				2,
				{
					id: true,
					name: true,
					grandChildren: [
						3,
						{
							id: true,
							name: true,
						},
					],
				},
			],
		});

		expect(partialParent).toHaveProperty("id");
		expect(partialParent).toHaveProperty("name");
		expect(partialParent).toHaveProperty("children");
		expect(partialParent.children).toHaveLength(2);
		expect(partialParent.children[0]).toHaveProperty("id");
		expect(partialParent.children[0]).toHaveProperty("name");
		expect(partialParent.children[0]).toHaveProperty("grandChildren");
		expect(partialParent.children[0].grandChildren).toHaveLength(3);
		expect(partialParent.children[0].grandChildren[0]).toHaveProperty("id");
		expect(partialParent.children[0].grandChildren[0]).toHaveProperty("name");
		expect(partialParent.children[0].parentId).toBe(partialParent.id);
		expect(partialParent.children[0].grandChildren[0].childId).toBe(partialParent.children[0].id);
	});

	it("should handle mixing array and single relations in the same entity", () => {
		class Category {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.commerce.department())
			name: string;
		}

		class Comment {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.sentence())
			text: string;

			@FactoryField((faker) => faker.number.int())
			postId: number;
		}

		class Post {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.sentence())
			title: string;

			@FactoryField((faker) => faker.number.int())
			categoryId: number;

			@FactoryRelationField(() => Category, { key: "categoryId", inverseKey: "id" })
			category: Category;

			@FactoryRelationField(() => [Comment], { key: "id", inverseKey: "postId" })
			comments: Comment[];
		}

		const factory = new Factory(faker);
		const partialPost = factory.partial(Post, {
			id: true,
			title: true,
			category: {
				id: true,
				name: true,
			},
			comments: [
				2,
				{
					id: true,
					text: true,
				},
			],
		});

		expect(partialPost).toHaveProperty("id");
		expect(partialPost).toHaveProperty("title");
		expect(partialPost).toHaveProperty("category");
		expect(partialPost).toHaveProperty("comments");
		expect(partialPost.category).toHaveProperty("id");
		expect(partialPost.category).toHaveProperty("name");
		expect(partialPost.comments).toHaveLength(2);
		expect(partialPost.comments[0]).toHaveProperty("id");
		expect(partialPost.comments[0]).toHaveProperty("text");
		expect(partialPost.category.id).toBe(partialPost.category.id);
		expect(partialPost.comments[0].postId).toBe(partialPost.id);
	});

	// New API tests
	describe("New API", () => {
		it("should create a single entity with one().make()", () => {
			class Cat {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
				name: string;
			}

			const factory = new Factory(faker);
			const cat = factory.one(Cat).make();

			expect(cat).toBeInstanceOf(Cat);
			expect(typeof cat.id).toBe("number");
			expect(typeof cat.name).toBe("string");
		});

		it("should create a single entity with override using one().override().make()", () => {
			class Cat {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
				name: string;
			}

			const factory = new Factory(faker);
			const cat = factory
				.one(Cat)
				.override(() => ({
					name: "John Doe",
				}))
				.make();

			expect(cat).toBeInstanceOf(Cat);
			expect(cat.name).toBe("John Doe");
			expect(typeof cat.id).toBe("number");
		});

		it("should create multiple entities with many().make()", () => {
			class Cat {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
				name: string;
			}

			const factory = new Factory(faker);
			const amount = 3;
			const cats = factory.many(Cat, amount).make();

			expect(cats).toHaveLength(amount);
			expect(cats[0]).toBeInstanceOf(Cat);
			expect(typeof cats[0].id).toBe("number");
			expect(typeof cats[0].name).toBe("string");
		});

		it("should create multiple entities with override using many().override().make()", () => {
			class Cat {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
				name: string;
			}

			const factory = new Factory(faker);
			const amount = 3;
			const cats = factory
				.many(Cat, amount)
				.override((entities) =>
					entities.map((_, index) => ({
						name: `User ${index + 1}`,
					})),
				)
				.make();

			expect(cats).toHaveLength(amount);
			expect(cats[0]).toBeInstanceOf(Cat);
			expect(cats[0].name).toBe("User 1");
			expect(cats[1].name).toBe("User 2");
			expect(cats[2].name).toBe("User 3");
		});

		it("should create an entity with relation using one().make()", () => {
			class Dog {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
				name: string;
			}

			class Cat {
				@FactoryRelationField(() => Dog)
				field: Dog;
			}

			const factory = new Factory(faker);
			const cat = factory
				.one(Cat, {
					field: true,
				})
				.make();

			expect(cat).toBeInstanceOf(Cat);
			expect(cat.field).toBeInstanceOf(Dog);
		});

		it("should create an entity with relation array using one().make()", () => {
			class Dog {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
				name: string;
			}

			class Cat {
				@FactoryRelationField(() => [Dog])
				field: Dog[];
			}

			const factory = new Factory(faker);
			const cat = factory
				.one(Cat, {
					field: [5],
				})
				.make();

			expect(cat).toBeInstanceOf(Cat);
			expect(Array.isArray(cat.field)).toBeTruthy();
			expect(cat.field).toHaveLength(5);
			expect(cat.field[0]).toBeInstanceOf(Dog);
		});

		it("should create an entity with relation array with override using one().override().make()", () => {
			class Dog {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
				name: string;
			}

			class Cat {
				@FactoryRelationField(() => [Dog])
				field: Dog[];
			}

			const factory = new Factory(faker);
			const cat = factory
				.one(Cat, {
					field: [5],
				})
				.override(() => ({
					field: [{ name: "Custom Name" }],
				}))
				.make();

			expect(cat).toBeInstanceOf(Cat);
			expect(Array.isArray(cat.field)).toBeTruthy();
			expect(cat.field).toHaveLength(5);
			expect(cat.field[0]).toBeInstanceOf(Dog);
			expect(cat.field[0].name).toBe("Custom Name");
		});

		it("should create a partial entity with one().partial().make()", () => {
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
			const user = factory
				.one(User)
				.partial({
					id: true,
					firstName: true,
				})
				.make();

			expect(user).toBeInstanceOf(User);
			expect(user).toHaveProperty("id");
			expect(user).toHaveProperty("firstName");
			expect(user).not.toHaveProperty("lastName");
			expect(user).not.toHaveProperty("email");
			expect(typeof user.id).toBe("number");
			expect(typeof user.firstName).toBe("string");
		});

		it("should create partial entities with many().partial().make()", () => {
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
			const amount = 3;
			const users = factory
				.many(User, amount)
				.partial({
					id: true,
					firstName: true,
				})
				.make();

			expect(users).toHaveLength(amount);
			expect(users[0]).toBeInstanceOf(User);
			expect(users[0]).toHaveProperty("id");
			expect(users[0]).toHaveProperty("firstName");
			expect(users[0]).not.toHaveProperty("lastName");
			expect(users[0]).not.toHaveProperty("email");
			expect(typeof users[0].id).toBe("number");
			expect(typeof users[0].firstName).toBe("string");
		});

		it("should create a partial entity with relations using one().partial().make()", () => {
			class Photo {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.image.url())
				url: string;

				@FactoryField((faker) => faker.lorem.sentence())
				description: string;

				@FactoryField((faker) => faker.number.int())
				userId: number;
			}

			class User {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.person.fullName())
				name: string;

				@FactoryRelationField(() => Photo, { key: "id", inverseKey: "userId" })
				photo: Photo;
			}

			const factory = new Factory(faker);
			const user = factory
				.one(User)
				.partial({
					id: true,
					name: true,
					photo: {
						id: true,
						url: true,
					},
				})
				.make();

			expect(user).toBeInstanceOf(User);
			expect(user).toHaveProperty("id");
			expect(user).toHaveProperty("name");
			expect(user).toHaveProperty("photo");
			expect(user.photo).toHaveProperty("id");
			expect(user.photo).toHaveProperty("url");
			expect(user.photo).not.toHaveProperty("description");
			expect(typeof user.id).toBe("number");
			expect(typeof user.name).toBe("string");
			expect(typeof user.photo.id).toBe("number");
			expect(typeof user.photo.url).toBe("string");
			expect(user.photo.userId).toBe(user.id);
		});

		it("should create a partial entity with override using one().partial().override().make()", () => {
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
			const user = factory
				.one(User)
				.partial({
					id: true,
					firstName: true,
				})
				.override(() => ({
					firstName: "Custom Name",
				}))
				.make();

			expect(user).toBeInstanceOf(User);
			expect(user).toHaveProperty("id");
			expect(user).toHaveProperty("firstName");
			expect(user).not.toHaveProperty("lastName");
			expect(user).not.toHaveProperty("email");
			expect(typeof user.id).toBe("number");
			expect(user.firstName).toBe("Custom Name");
		});

		it("should create partial entities with override using many().partial().override().make()", () => {
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
			const amount = 3;
			const users = factory
				.many(User, amount)
				.partial({
					id: true,
					firstName: true,
				})
				.override((entities) =>
					entities.map((_, index) => ({
						firstName: `User ${index + 1}`,
					}))
				)
				.make();

			expect(users).toHaveLength(amount);
			expect(users[0]).toBeInstanceOf(User);
			expect(users[0]).toHaveProperty("id");
			expect(users[0]).toHaveProperty("firstName");
			expect(users[0]).not.toHaveProperty("lastName");
			expect(users[0]).not.toHaveProperty("email");
			expect(typeof users[0].id).toBe("number");
			expect(users[0].firstName).toBe("User 1");
			expect(users[1].firstName).toBe("User 2");
			expect(users[2].firstName).toBe("User 3");
		});
	});

	describe("Advanced scenarios", () => {
		it("should handle circular dependencies using one().make()", () => {
			class Parent {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.person.fullName())
				name: string;

				@FactoryRelationField(() => Child, { key: "id", inverseKey: "parentId" })
				child: Child;
			}

			class Child {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.person.fullName())
				name: string;

				@FactoryField((faker) => faker.number.int())
				parentId: number;

				@FactoryRelationField(() => Parent, { key: "parentId", inverseKey: "id" })
				parent: Parent;
			}

			const factory = new Factory(faker);
			const parent = factory
				.one(Parent, {
					child: {
						parent: true,
					},
				})
				.make();

			expect(parent).toBeInstanceOf(Parent);
			expect(parent.child).toBeInstanceOf(Child);
			expect(parent.child.parent).toBeInstanceOf(Parent);
			expect(parent.child.parentId).toBe(parent.id);
			expect(parent.child.parent.id).toBe(parent.id);

			// Verify that we don't have infinite recursion
			expect(parent.child.parent.child).toBeUndefined();
		});

		it("should handle very deeply nested relationships using one().make()", () => {
			class Level4 {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.lorem.word())
				name: string;

				@FactoryField((faker) => faker.number.int())
				level3Id: number;
			}

			class Level3 {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.lorem.word())
				name: string;

				@FactoryField((faker) => faker.number.int())
				level2Id: number;

				@FactoryRelationField(() => [Level4], { key: "id", inverseKey: "level3Id" })
				level4Items: Level4[];
			}

			class Level2 {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.lorem.word())
				name: string;

				@FactoryField((faker) => faker.number.int())
				level1Id: number;

				@FactoryRelationField(() => [Level3], { key: "id", inverseKey: "level2Id" })
				level3Items: Level3[];
			}

			class Level1 {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.lorem.word())
				name: string;

				@FactoryRelationField(() => [Level2], { key: "id", inverseKey: "level1Id" })
				level2Items: Level2[];
			}

			const factory = new Factory(faker);
			const level1 = factory
				.one(Level1, {
					level2Items: [
						2,
						{
							level3Items: [
								2,
								{
									level4Items: [3],
								},
							],
						},
					],
				})
				.make();

			expect(level1).toBeInstanceOf(Level1);
			expect(level1.level2Items).toHaveLength(2);
			expect(level1.level2Items[0]).toBeInstanceOf(Level2);
			expect(level1.level2Items[0].level1Id).toBe(level1.id);

			expect(level1.level2Items[0].level3Items).toHaveLength(2);
			expect(level1.level2Items[0].level3Items[0]).toBeInstanceOf(Level3);
			expect(level1.level2Items[0].level3Items[0].level2Id).toBe(level1.level2Items[0].id);

			expect(level1.level2Items[0].level3Items[0].level4Items).toHaveLength(3);
			expect(level1.level2Items[0].level3Items[0].level4Items[0]).toBeInstanceOf(Level4);
			expect(level1.level2Items[0].level3Items[0].level4Items[0].level3Id).toBe(level1.level2Items[0].level3Items[0].id);
		});

		it("should handle multiple circular dependencies in a complex relationship graph", () => {
			// Define a complex relationship graph with multiple circular dependencies
			class User {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.person.fullName())
				name: string;

				@FactoryRelationField(() => [Post], { key: "id", inverseKey: "authorId" })
				posts: Post[];

				@FactoryRelationField(() => [Comment], { key: "id", inverseKey: "userId" })
				comments: Comment[];
			}

			class Post {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.lorem.sentence())
				title: string;

				@FactoryField((faker) => faker.number.int())
				authorId: number;

				@FactoryRelationField(() => User, { key: "authorId", inverseKey: "id" })
				author: User;

				@FactoryRelationField(() => [Comment], { key: "id", inverseKey: "postId" })
				comments: Comment[];
			}

			class Comment {
				@FactoryField((faker) => faker.number.int())
				id: number;

				@FactoryField((faker) => faker.lorem.paragraph())
				content: string;

				@FactoryField((faker) => faker.number.int())
				userId: number;

				@FactoryField((faker) => faker.number.int())
				postId: number;

				@FactoryRelationField(() => User, { key: "userId", inverseKey: "id" })
				user: User;

				@FactoryRelationField(() => Post, { key: "postId", inverseKey: "id" })
				post: Post;
			}

			const factory = new Factory(faker);

			// Create a user with posts, where each post has comments, and each comment references back to the user and post
			const user = factory
				.one(User, {
					posts: [
						2,
						{
							comments: [
								2,
								{
									user: true,
									post: true,
								},
							],
							author: true,
						},
					],
				})
				.make();

			expect(user).toBeInstanceOf(User);
			expect(user.posts).toHaveLength(2);

			// Check first level of circular references
			for (const post of user.posts) {
				expect(post).toBeInstanceOf(Post);
				expect(post.authorId).toBe(user.id);
				expect(post.author).toBeInstanceOf(User);
				expect(post.author.id).toBe(user.id); // Same ID, but not necessarily the same instance
				expect(post.comments).toHaveLength(2);

				// Check second level of circular references
				for (const comment of post.comments) {
					expect(comment).toBeInstanceOf(Comment);
					expect(comment.postId).toBe(post.id);
					expect(comment.post).toBeInstanceOf(Post);
					expect(comment.post.id).toBe(comment.postId); // IDs match
					expect(comment.user).toBeInstanceOf(User);
					expect(comment.user.id).toBe(comment.userId); // IDs match
				}
			}
		});
	});
});
