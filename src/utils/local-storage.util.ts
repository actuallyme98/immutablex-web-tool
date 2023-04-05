import { LocalStorageKeyEnums } from '../enums/key.enum';

export const setItem = (key: LocalStorageKeyEnums, value: any) => {
  return localStorage.setItem(key, value);
};

export const getItem = (key: LocalStorageKeyEnums) => {
  return localStorage.getItem(key);
};

export const removeItem = (key: LocalStorageKeyEnums) => {
  return localStorage.removeItem(key);
};
