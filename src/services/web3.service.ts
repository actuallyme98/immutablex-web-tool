import { AlchemyProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { createStarkSigner, generateStarkPrivateKey } from '@imtbl/core-sdk';

const provider = new AlchemyProvider('goerli', 'HA_Kq_-zHqypma_FtpcmsHnPm0UVnbmD');

export const wallet = new Wallet(
  'fadbfeda5aec6fe24da3797bd5963fed2766d01c382b85c5d5f42eee0fc186d1',
);

export const ethSigner = wallet.connect(provider);

export const publicKey = wallet.publicKey;

const starkPrivateKey = generateStarkPrivateKey();
export const starkSigner = createStarkSigner(starkPrivateKey);
