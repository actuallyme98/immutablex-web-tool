type PickWithOptional<Base, OptionalKey extends keyof Base> = Pick<
  Base,
  Exclude<keyof Base, OptionalKey>
> & {
  [Key in OptionalKey]?: Base[Key];
};
