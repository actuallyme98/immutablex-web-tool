import React from 'react';

import Button from '@mui/material/Button';

import { ImmutableX, Config } from '@imtbl/core-sdk';

import { ethSigner, starkSigner } from './services/web3.service';
import axios from './services/api.service';

const walletConnection = { ethSigner, starkSigner };

const MainApp: React.FC = () => {
  const config = Config.SANDBOX;
  const client = new ImmutableX(config);

  const getAssets = async () => {
    const response = await client.getAsset({
      tokenAddress: '0xc54d7F54C7F9Cc10a30b8e6bA00ac67e7Eb16fcF',
      tokenId: '1',
    });

    console.log('response', response);
  };

  const mintAssets = async () => {
    const response = await client.mint(ethSigner, {
      contract_address: '0xc54d7F54C7F9Cc10a30b8e6bA00ac67e7Eb16fcF',
      users: [
        {
          tokens: [
            {
              blueprint: 'on-chain-metadata',
              id: '1',
            },
          ],
          user: '0x1B6ae013DB933eE4910030E4130536B007F73CE3',
        },
      ],
    });

    console.log('response', response);
  };

  const createOrder = async () => {
    const timestamp = new Date(Date.now());
    timestamp.setMonth(timestamp.getMonth() + 1);
    const timestampUnix = Math.round(timestamp.getTime() / 1000);

    const response = await client.createOrder(walletConnection, {
      buy: {
        amount: '10000000000000000',
        type: 'ETH',
      },
      sell: {
        tokenAddress: '0xc54d7F54C7F9Cc10a30b8e6bA00ac67e7Eb16fcF',
        tokenId: '1',
        type: 'ERC721',
      },
      expiration_timestamp: timestampUnix,
      fees: [
        {
          address: '0x1B6ae013DB933eE4910030E4130536B007F73CE3',
          fee_percentage: 2.5,
        },
      ],
    });

    console.log('response', response);
  };

  const onChangeFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target?.files?.[0];

    const text = await file?.text();

    console.log(text?.split('\n').map((item) => item.trim()));

    event.target.value = '';
  };

  return (
    <div>
      <input type="file" onChange={onChangeFile} accept="text/plain" />
      <br />
      <Button onClick={mintAssets}>Mint assets</Button>
      <br />
      <Button onClick={getAssets}>Get Assets</Button>
      <br />
      <Button onClick={createOrder}>Create Order</Button>
    </div>
  );
};

export default MainApp;
