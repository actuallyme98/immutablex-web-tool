import * as LocalStorageUtils from './local-storage.util';

import { LocalStorageKeyEnums } from '../enums/key.enum';

import { TradingClient } from '../types/local-storage';

export const getDatas = () => {
  const jsonData = LocalStorageUtils.getItem(LocalStorageKeyEnums.SESSION_DATAS);

  if (!jsonData) return [];

  return JSON.parse(jsonData) as TradingClient[];
};

export const saveTradingSession = (datas: TradingClient[]) => {
  return LocalStorageUtils.setItem(LocalStorageKeyEnums.SESSION_DATAS, JSON.stringify(datas));
};
