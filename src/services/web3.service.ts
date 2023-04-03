import { AlchemyProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { createStarkSigner, generateStarkPrivateKey } from '@imtbl/core-sdk';

const provider = new AlchemyProvider('goerli', 'HA_Kq_-zHqypma_FtpcmsHnPm0UVnbmD');

export const wallet = new Wallet(process.env.PRIVATE_KEY || '');

export const ethSigner = wallet.connect(provider);

export const publicKey = wallet.publicKey;

const starkPrivateKey = generateStarkPrivateKey();
export const starkSigner = createStarkSigner(starkPrivateKey);
