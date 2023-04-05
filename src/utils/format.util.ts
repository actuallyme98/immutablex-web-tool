import { LoadedUser } from '../types/local-storage';

export const formatArrayOfKeys = (value = '', separator = ',') => {
  return value.split(separator).map((item) => item.trim());
};

export const toUsers = (lines: string[]) => {
  const users: LoadedUser[] = [];

  for (let i = 0; i < lines.length; i++) {
    const formattedUser = formatArrayOfKeys(lines[i]);

    users.push({
      privateKey: formattedUser[0],
      starkPrivateKey: formattedUser[1],
      tokenAddress: formattedUser[2],
      tokenId: formattedUser[3],
    });
  }

  return users;
};

export const etherToWei = (value: string) => {
  const unit = 1e18;

  const result = unit * parseFloat(value);

  return result.toString();
};
