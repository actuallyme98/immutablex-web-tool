import { AlchemyProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { ImmutableX, Config, ImmutableXConfiguration } from '@imtbl/core-sdk';

const alchemyKey = process.env.REACT_APP_ALCHEMY_KEY || '';
const networkName = 'goerli';

const provider = new AlchemyProvider(networkName, alchemyKey);

type GetIMXElementsOptions = {
  config?: ImmutableXConfiguration;
  walletPrivateKey: string;
};
export const getIMXElements = (options: GetIMXElementsOptions) => {
  const { config = Config.SANDBOX, walletPrivateKey } = options;

  const client = new ImmutableX(config);

  const wallet = new Wallet(walletPrivateKey);
  const ethSigner = wallet.connect(provider);

  return {
    client,
    wallet,
    ethSigner,
  };
};
