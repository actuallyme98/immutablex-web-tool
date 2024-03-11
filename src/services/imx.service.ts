import { AlchemyProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { ImmutableX, Config, ImmutableXConfiguration, createStarkSigner } from '@imtbl/core-sdk';

const alchemyKey = process.env.REACT_APP_ALCHEMY_KEY || '';
const networkName = 'mainnet';

const provider = new AlchemyProvider(networkName, alchemyKey);

type GetIMXElementsOptions = {
  config?: ImmutableXConfiguration;
  walletPrivateKey: string;
  starkPrivateKey?: string;
};

export type ClientSet = {
  client: ImmutableX;
  wallet: Wallet;
  ethSigner: Wallet;
};

export const getIMXElements = (options: GetIMXElementsOptions) => {
  const { config = Config.PRODUCTION, walletPrivateKey, starkPrivateKey } = options;

  const client = new ImmutableX(config);

  const wallet = new Wallet(walletPrivateKey);
  const ethSigner = wallet.connect(provider);
  const starkSigner = createStarkSigner(starkPrivateKey || '');

  return {
    client,
    wallet,
    ethSigner,
    starkSigner,
  };
};
