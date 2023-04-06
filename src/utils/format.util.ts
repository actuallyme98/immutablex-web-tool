import { Row } from 'read-excel-file';
import { LoadedUser } from '../types/local-storage';
import { CsvFormattedKeyEnums } from '../enums/key.enum';

export const formatArrayOfKeys = (value = '', separator = ',') => {
  return value.split(separator).map((item) => item.trim());
};

export const fromTxtToUsers = (lines: string[]) => {
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

export const fromCsvToUsers = (rows: Row[]): LoadedUser[] => {
  const [headerRow, ...contentRows] = rows;

  let walletPKColIndex = headerRow.findIndex(
    (label) => label === CsvFormattedKeyEnums.WALLET_PRIVATE_KEY,
  );
  let starkPKColIndex = headerRow.findIndex(
    (label) => label === CsvFormattedKeyEnums.STARK_PRIVATE_KEY,
  );
  let collectionAddressColIndex = headerRow.findIndex(
    (label) => label === CsvFormattedKeyEnums.COLLECTION_ADDRESS,
  );
  let tokenIdColIndex = headerRow.findIndex((label) => label === CsvFormattedKeyEnums.TOKEN_ID);

  if (walletPKColIndex < 0) {
    walletPKColIndex = 0;
  }

  if (starkPKColIndex < 0) {
    starkPKColIndex = 1;
  }

  if (collectionAddressColIndex < 0) {
    collectionAddressColIndex = 2;
  }

  if (tokenIdColIndex < 0) {
    tokenIdColIndex = 3;
  }

  return contentRows.map((row) => ({
    privateKey: row[walletPKColIndex].toString(),
    starkPrivateKey: row[starkPKColIndex].toString(),
    tokenAddress: row[collectionAddressColIndex].toString(),
    tokenId: row[tokenIdColIndex].toString(),
  }));
};

export const etherToWei = (value: string) => {
  const unit = 1e18;

  const result = unit * parseFloat(value);

  return result.toString();
};
