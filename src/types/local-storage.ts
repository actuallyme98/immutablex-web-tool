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
  orderId?: string;
  index?: number;
};

export type TradingServiceV3 = {
  fileName: string;
  clients: TradingService[];
};

export type ConnectedService = {
  id: string;
  service: ImmutableService;
  privateKey: string;
  starkPrivateKey: string;
  walletName?: string;
};

export type GasOptions = {
  maxPriorityFeePerGas: number;
  maxFeePerGas: number;
  gasLimit: number;
};
