import "reflect-metadata";
import { faker } from "@faker-js/faker";
import { FactoryField, FactoryRelationField } from "../decorators";
import { Factory } from "./factory";
import { Overridable } from "./overridable";

describe("Factory tests", () => {
	it("should create an entity", () => {
		class DummyEntity {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);

		const dummyEntity = factory.new(DummyEntity);
		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(typeof dummyEntity.id).toBe("number");
		expect(typeof dummyEntity.name).toBe("string");
	});

	it("should create an entity with override", () => {
		const dummyEntityId = 1;
		class DummyEntity {
			@FactoryField(() => dummyEntityId)
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);
		const dummyEntity = factory.create(DummyEntity).override(() => ({ name: "Hello World" }));

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(dummyEntity.name).toBe("Hello World");
		expect(dummyEntity.id).toBe(dummyEntityId);
	});

	it("should inject faker instance", () => {
		const factory = new Factory(faker);
		expect(factory).toHaveProperty("faker");
	});

	it("should create an entity with relation", () => {
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

		const factory = new Factory(faker);
		const dummyEntity = factory.new(DummyEntity, {
			field: true,
		});

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(dummyEntity.field).toBeInstanceOf(DummyRelationEntity);
	});

	it("should create an entity with relation array", () => {
		class DummyRelationEntity {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		class DummyEntity {
			@FactoryRelationField(() => [DummyRelationEntity])
			field: DummyRelationEntity[];
		}

		const factory = new Factory(faker);
		const dummyEntity = factory.new(DummyEntity, {
			field: [1],
		});

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(Array.isArray(dummyEntity.field)).toBeTruthy();
		expect(dummyEntity.field[0]).toBeInstanceOf(DummyRelationEntity);
	});

	it("should create an entity with relation array with override", () => {
		class DummyRelationEntity {
			@FactoryField((faker) => faker.number.int({ min: 999, max: 999999 }))
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		class DummyEntity {
			@FactoryRelationField(() => [DummyRelationEntity])
			field: DummyRelationEntity[];
		}

		const factory = new Factory(faker);
		const dummyEntity = factory
			.create(DummyEntity, {
				field: [1],
			})
			.override(() => ({
				field: [{ name: "Hello World" }],
			}));

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(Array.isArray(dummyEntity.field)).toBeTruthy();
		expect(dummyEntity.field[0]).toBeInstanceOf(DummyRelationEntity);
		expect(dummyEntity.field[0].name).toBe("Hello World");
	});

	it("should replace a value to null", () => {
		class DummyEntity {
			@FactoryField(() => 1)
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);

		const dummyEntity = factory.create(DummyEntity).override(() => ({
			name: null,
		}));

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(dummyEntity.name).toBeNull();
	});

	it("should create an entity with relation and replace relation value to null", () => {
		class DummyRelationEntity {
			@FactoryField((faker) => faker.number.int({ min: 999, max: 999999 }))
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		class DummyEntity {
			@FactoryRelationField(() => [DummyRelationEntity])
			field: DummyRelationEntity[];
		}

		const factory = new Factory(faker);
		const dummyEntity = factory
			.create(DummyEntity, {
				field: [1],
			})
			.override(() => ({
				field: [{ name: null }],
			}));

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(Array.isArray(dummyEntity.field)).toBeTruthy();
		expect(dummyEntity.field[0]).toBeInstanceOf(DummyRelationEntity);
		expect(dummyEntity.field[0].name).toBeNull();
	});

	it("should instantiate a list of entities", () => {
		class DummyEntity {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);
		const amount = 3;
		const dummyEntities = factory.newList(DummyEntity, amount);
		expect(dummyEntities).toHaveLength(amount);
	});

	it("should create list of overridable entities", () => {
		class DummyEntity {
			@FactoryField((faker) => faker.number.int())
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);
		const amount = 3;
		const overridable = factory.createList(DummyEntity, amount);
		expect(overridable).toBeInstanceOf(Overridable);
	});

	it("should return the instance", () => {
		class DummyEntity {
			id: number;
			name: string;
		}

		const dummyInstance = new DummyEntity();
		dummyInstance.id = 1;
		dummyInstance.name = "Test Name";

		const overridable = new Overridable(dummyInstance);
		const instance = overridable.getInstance();

		expect(instance).toBe(dummyInstance);
		expect(instance.id).toBe(1);
		expect(instance.name).toBe("Test Name");
	});

	it("should override a field to null", () => {
		class DummyEntity {
			@FactoryField(() => 1)
			id: number;

			@FactoryField((faker) => faker.lorem.words({ min: 1, max: 3 }))
			name: string;
		}

		const factory = new Factory(faker);
		const dummyEntity = factory.create(DummyEntity).override(() => ({
			name: null,
		}));

		expect(dummyEntity).toBeInstanceOf(DummyEntity);
		expect(dummyEntity.name).toBeNull();
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
				// We don't include parent here to avoid infinite recursion
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
});
