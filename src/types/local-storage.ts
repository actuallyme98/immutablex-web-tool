import { ClientSet } from '../services/imx.service';
import { ImmutableService } from '../services';

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
  targetWallet?: string;
};

export type TradingClient = LoadedUser & ClientSet;

export type TradingService = LoadedUser & {
  service: ImmutableService;
};

export type ConnectedService = {
  id: string;
  service: ImmutableService;
  privateKey: string;
  starkPrivateKey: string;
  walletName?: string;
};
