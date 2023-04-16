export const compareAddresses = (from: string, to: string) => {
  return from.toLocaleLowerCase() === to.toLocaleLowerCase();
};
