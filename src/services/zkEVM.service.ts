import { x, config, passport, orderbook } from '@imtbl/sdk';
import { BlockchainData } from '@imtbl/sdk/blockchain_data';
import { Wallet } from '@ethersproject/wallet';
import { AlchemyProvider, JsonRpcProvider } from '@ethersproject/providers';
import { WIMX_ADDRESS } from '../constants/imx';

const { Environment, ImmutableConfiguration } = config;

const {
  ProviderConfiguration,
  // createStarkSigner,
  // GenericIMXProvider,
  Contracts,
  IMXClient,
  imxClientConfig,
} = x;

const ethNetwork = 'mainnet';
const alchemyAPIKey = process.env.REACT_APP_ALCHEMY_ZKEVM_KEY || '';
const publishableKey = process.env.REACT_APP_EKEVM_PUBLISHABLE_KEY || '';
const clientId = process.env.REACT_APP_EKEVM_CLIENT_ID || '';
const environment = Environment.PRODUCTION;

const client = new IMXClient(imxClientConfig({ environment }));

const rpcProvider = new JsonRpcProvider({
  url: 'https://rpc.immutable.com/',
});

const providerConfig = new ProviderConfiguration({
  baseConfig: new ImmutableConfiguration({ environment }),
});

const blockchainProvider = new BlockchainData({
  baseConfig: new ImmutableConfiguration({ environment }),
});

const passportInstance = new passport.Passport({
  baseConfig: {
    environment: config.Environment.PRODUCTION,
    publishableKey,
  },
  clientId,
  redirectUri: 'https://localhost:3000/redirect',
  logoutRedirectUri: 'https://localhost:3000/logout',
  audience: 'platform_api',
  scope: 'openid offline_access email transact',
});

const orderBookClient = new orderbook.Orderbook({
  baseConfig: {
    environment: config.Environment.PRODUCTION,
    publishableKey,
  },
});

type GetIMXElementsOptions = {
  walletPrivateKey: string;
};

export const getzkEVMElements = (options: GetIMXElementsOptions) => {
  const { walletPrivateKey } = options;

  const provider = new AlchemyProvider(ethNetwork, alchemyAPIKey);
  const wallet = new Wallet(walletPrivateKey);

  const ethSigner = wallet.connect(provider);

  // const starkSigner = createStarkSigner(starkPrivateKey);

  // const imxProvider = new GenericIMXProvider(providerConfig, ethSigner, starkSigner);

  const passportProvider = passportInstance.connectEvm();

  const contract = Contracts.Core.connect(WIMX_ADDRESS, wallet);

  const zkEVMSigner = new Wallet(walletPrivateKey, rpcProvider);

  return {
    // imxProvider,
    blockchainProvider,
    contract,
    passportInstance,
    orderBookClient,
    passportProvider,
    client,
    wallet,
    zkEVMSigner,
    ethSigner,
    // starkSigner,
    walletPrivateKey,
  };
};
