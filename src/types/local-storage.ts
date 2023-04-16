import { ClientSet } from '../services/imx.service';

export type StarkPrivateKeyWithAddress = {
  address: string;
  starkPrivateKey: string;
};

export type LoadedUser = {
  privateKey: string;
  starkPrivateKey: string;
  tokenAddress?: string;
  tokenId?: string;
  walletName?: string;
};

export type TradingClient = LoadedUser & ClientSet;

export type ConnectedWallet = ClientSet & {
  id: string;
  starkPrivateKey: string;
  walletName?: string;
};
