export namespace TypedObject {
  export const fromEntries = Object.fromEntries as <Key extends PropertyKey, Entries extends ReadonlyArray<readonly [Key, unknown]>>(values: Entries) => {
    [K in Extract<Entries[number], readonly [Key, unknown]>[0]]: Extract<Entries[number], readonly [K, unknown]>[1]
  };
  type ObjectKeys<T extends object> = keyof T;
  export const keys = Object.keys as <Type extends object>(value: Type) => Array<ObjectKeys<Type>>;
  export const entries = Object.entries as <Type extends Record<PropertyKey, unknown>>(value: Type) => Array<[ObjectKeys<Type>, Type[ObjectKeys<Type>]]>;
}