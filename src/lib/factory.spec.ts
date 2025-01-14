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
});
