import { x, config } from '@imtbl/sdk';
import { BlockchainData } from '@imtbl/sdk/blockchain_data';
import { Wallet } from '@ethersproject/wallet';
import { AlchemyProvider } from '@ethersproject/providers';

const { Environment, ImmutableConfiguration } = config;

const {
  ProviderConfiguration,
  createStarkSigner,
  GenericIMXProvider,
  BalancesApi,
  AssetsApi,
  OrdersApi,
} = x;

const ethNetwork = 'mainnet';
const alchemyAPIKey = process.env.REACT_APP_ALCHEMY_ZKEVM_KEY || '';

type GetIMXElementsOptions = {
  walletPrivateKey: string;
  starkPrivateKey: string;
};

export const getzkEVMElements = (options: GetIMXElementsOptions) => {
  const { walletPrivateKey, starkPrivateKey } = options;

  const provider = new AlchemyProvider(ethNetwork, alchemyAPIKey);
  const wallet = new Wallet(walletPrivateKey);

  const ethSigner = wallet.connect(provider);

  const starkSigner = createStarkSigner(starkPrivateKey);

  const environment = Environment.PRODUCTION;
  const providerConfig = new ProviderConfiguration({
    baseConfig: new ImmutableConfiguration({ environment }),
  });

  const blockchainProvider = new BlockchainData({
    baseConfig: new ImmutableConfiguration({ environment }),
  });

  const imxProvider = new GenericIMXProvider(providerConfig, ethSigner, starkSigner);

  const balancesApi = new BalancesApi();
  const assetsApi = new AssetsApi();
  const ordersApi = new OrdersApi();

  return {
    imxProvider,
    blockchainProvider,
    balancesApi,
    assetsApi,
    ordersApi,
    wallet,
    ethSigner,
    starkSigner,
  };
};
