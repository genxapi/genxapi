export type Mutable<T> = {
  -readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U>
    ? Mutable<U>[]
    : T[P] extends Array<infer U>
      ? Mutable<U>[]
      : Mutable<T[P]>;
};
