export function extendArrayMetadata<T extends Array<unknown>>(
	key: string | Symbol,
	metadata: T,
	target: any,
) {
	const previousValue = Reflect.getMetadata(key, target) || [];
	const value = [...previousValue, ...metadata];
	Reflect.defineMetadata(key, value, target);
}
