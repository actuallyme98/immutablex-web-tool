export const compareAddresses = (from: string, to: string) => {
  return from.toLocaleLowerCase() === to.toLocaleLowerCase();
};

export const randomString = (length = 8) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const toShortAddress = (address: string) => {
  const length = address.length;

  const first4 = address.substring(0, 6);
  const last4 = address.substring(length - 4);

  return `${first4}...${last4}`;
};
