import * as LocalStorageUtils from './local-storage.util';

import { LocalStorageKeyEnums } from '../enums/key.enum';

import { StarkPrivateKeyWithAddress } from '../types/local-storage';

export const getDatas = () => {
  const jsonData = LocalStorageUtils.getItem(LocalStorageKeyEnums.ADDRESS_DATAS);

  if (!jsonData) return [];

  return JSON.parse(jsonData) as StarkPrivateKeyWithAddress[];
};

export const findOne = (address: string) => {
  const datas = getDatas();

  return datas.find((item) => item.address === address);
};

export const insertOne = (item: StarkPrivateKeyWithAddress) => {
  const datas = getDatas();

  const existData = findOne(item.address);

  if (existData) return false;

  const updatedDatas = datas.concat(item);

  LocalStorageUtils.setItem(LocalStorageKeyEnums.ADDRESS_DATAS, JSON.stringify(updatedDatas));

  return true;
};
