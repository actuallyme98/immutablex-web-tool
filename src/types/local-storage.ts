import { ClientSet } from '../services/imx.service';

export type StarkPrivateKeyWithAddress = {
  address: string;
  starkPrivateKey: string;
};

export type LoadedUser = {
  privateKey: string;
  starkPrivateKey: string;
  tokenAddress: string;
  tokenId: string;
};

export type TradingClient = LoadedUser &
  ClientSet & {
    isBought?: boolean;
    isSell?: boolean;
  };
