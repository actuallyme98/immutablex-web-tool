import { formatEther, toBigInt } from 'ethers';
import { orderbook } from '@imtbl/sdk';
import { getIMXElements } from './imx.service';
import { getzkEVMElements } from './zkEVM.service';
import axios from 'axios';

import { SelectedNetworkType } from '../types/store/app';

import { IMX_ADDRESS } from '../constants/imx';
import { X_REWARD_POOL_ENDPOINT, ZKEVM_REWARD_POOL_ENDPOINT } from '../constants/system';

import { BuyParams, SellParams, TransferParams } from './type';

const gasOverrides = {
  maxPriorityFeePerGas: 10e9,
  maxFeePerGas: 15e9,
  gasLimit: 250000,
};

export class ImmutableService {
  private keys: {
    walletPrivateKey: string;
    starkPrivateKey: string;
  } = {
    walletPrivateKey: '',
    starkPrivateKey: '',
  };

  constructor(
    private selectedNetwork: SelectedNetworkType,
    private walletPrivateKey: string,
    private starkPrivateKey: string,
  ) {
    this.keys = {
      walletPrivateKey,
      starkPrivateKey,
    };
  }

  getAddress() {
    if (this.selectedNetwork === 'ethereum') {
      const { ethSigner } = getIMXElements(this.keys);

      return ethSigner.address;
    }

    if (this.selectedNetwork === 'imxZkEVM') {
      const { ethSigner } = getzkEVMElements(this.keys);

      return ethSigner.address;
    }

    return '';
  }

  async getRemainingRewardPoints() {
    if (this.selectedNetwork === 'ethereum') {
      const { data } = await axios.get(X_REWARD_POOL_ENDPOINT);
      const remaining_points = data.result?.remaining_points || 0;
      return remaining_points;
    }

    if (this.selectedNetwork === 'imxZkEVM') {
      const { data } = await axios.get(ZKEVM_REWARD_POOL_ENDPOINT);
      const remaining_points = data.result?.remaining_points || 0;
      return remaining_points;
    }

    return 0;
  }

  async sell(args: SellParams) {
    const { request } = args;

    if (this.selectedNetwork === 'ethereum') {
      const { client, ethSigner, starkSigner } = getIMXElements(this.keys);

      return await client.createOrder(
        {
          ethSigner,
          starkSigner,
        },
        request,
      );
    }

    if (this.selectedNetwork === 'imxZkEVM') {
      const { zkEVMSigner, orderBookClient } = getzkEVMElements(this.keys);

      const offerer = await zkEVMSigner.getAddress();

      const preparedListing = await orderBookClient.prepareListing({
        makerAddress: offerer,
        buy: {
          amount: (request.buy as any).amount,
          type: 'NATIVE',
        },
        sell: {
          contractAddress: (request.sell as any).tokenAddress,
          tokenId: (request.sell as any).tokenId,
          type: (request.sell as any).type,
        },
      });

      let orderSignature = '';
      for (const action of preparedListing.actions) {
        if (action.type === orderbook.ActionType.TRANSACTION) {
          const builtTx = await action.buildTransaction();

          const txWithGasOverrides = {
            ...builtTx,
            ...gasOverrides,
          };

          await zkEVMSigner.sendTransaction(txWithGasOverrides);
        }

        if (action.type === orderbook.ActionType.SIGNABLE) {
          orderSignature = await zkEVMSigner._signTypedData(
            action.message.domain,
            action.message.types,
            action.message.value,
          );
        }
      }

      const order = await orderBookClient.createListing({
        orderComponents: preparedListing.orderComponents,
        orderHash: preparedListing.orderHash,
        orderSignature,
        // Optional maker marketplace fee
        makerFees: [],
      });

      return {
        order_id: order.result.id,
      };
    }

    throw new Error(`${this.selectedNetwork} does not support this method!`);
  }

  async buy(args: BuyParams) {
    const { request } = args;

    if (this.selectedNetwork === 'ethereum') {
      const { client, ethSigner, starkSigner } = getIMXElements(this.keys);

      return await client.createTrade(
        {
          ethSigner,
          starkSigner,
        },
        {
          ...request,
          user: request.user || ethSigner.address,
        },
      );
    }

    if (this.selectedNetwork === 'imxZkEVM') {
      const { zkEVMSigner, orderBookClient } = getzkEVMElements(this.keys);
      const offerer = await zkEVMSigner.getAddress();

      const { order, actions } = await orderBookClient.fulfillOrder(
        request.order_id as any,
        offerer,
        [],
      );

      for (const action of actions) {
        if (action.type === orderbook.ActionType.TRANSACTION) {
          const builtTx = await action.buildTransaction();

          const txWithGasOverrides = {
            ...builtTx,
            ...gasOverrides,
          };
          await zkEVMSigner.sendTransaction(txWithGasOverrides);
        }
      }

      return order;
    }

    throw new Error(`${this.selectedNetwork} does not support this method!`);
  }

  async getBalance(owner?: string) {
    if (this.selectedNetwork === 'ethereum') {
      const { client, ethSigner } = getIMXElements(this.keys);
      const response = await client.getBalance({
        address: IMX_ADDRESS,
        owner: owner || ethSigner.address,
      });

      return {
        balance: formatEther(response.balance),
      };
    }

    if (this.selectedNetwork === 'imxZkEVM') {
      const { ethSigner, passportProvider } = getzkEVMElements(this.keys);

      const response = await passportProvider.request({
        method: 'eth_getBalance',
        params: [owner || ethSigner.address, 'latest'],
      });

      const amount = toBigInt(response).toString();

      return {
        balance: formatEther(amount),
      };
    }

    throw new Error(`${this.selectedNetwork} does not support this method!`);
  }

  async getOrders(owner?: string) {
    if (this.selectedNetwork === 'ethereum') {
      const { client, ethSigner } = getIMXElements(this.keys);

      return await client.listOrders({
        user: owner || ethSigner.address,
        status: 'active',
      });
    }

    if (this.selectedNetwork === 'imxZkEVM') {
      const { ethSigner, orderBookClient } = getzkEVMElements(this.keys);

      const response = await orderBookClient.listListings({
        accountAddress: owner || ethSigner.address,
        status: orderbook.OrderStatusName.ACTIVE,
      });

      return response;
    }

    throw new Error(`${this.selectedNetwork} does not support this method!`);
  }

  async cancelOrder(orderId: number | string) {
    if (this.selectedNetwork === 'ethereum') {
      const { client, ethSigner, starkSigner } = getIMXElements(this.keys);

      return await client.cancelOrder(
        {
          ethSigner,
          starkSigner,
        },
        {
          order_id: Number(orderId),
        },
      );
    }

    if (this.selectedNetwork === 'imxZkEVM') {
      const { zkEVMSigner, orderBookClient } = getzkEVMElements(this.keys);

      const account = await zkEVMSigner.getAddress();

      const listingIds = [String(orderId)];

      const { signableAction } = await orderBookClient.prepareOrderCancellations(listingIds);
      const cancellationSignature = await zkEVMSigner._signTypedData(
        signableAction.message.domain,
        signableAction.message.types,
        signableAction.message.value,
      );

      return orderBookClient.cancelOrders(listingIds, account, cancellationSignature);
    }

    throw new Error(`${this.selectedNetwork} does not support this method!`);
  }

  async getAssets(owner?: string) {
    if (this.selectedNetwork === 'ethereum') {
      const { client, ethSigner } = getIMXElements(this.keys);

      return await client.listAssets({
        user: owner || ethSigner.address,
      });
    }

    if (this.selectedNetwork === 'imxZkEVM') {
      const { ethSigner, blockchainProvider } = getzkEVMElements(this.keys);

      const response = await blockchainProvider.listNFTsByAccountAddress({
        accountAddress: owner || ethSigner.address,
        chainName: 'imtbl-zkevm-mainnet',
      });

      return response as any;
    }

    throw new Error(`${this.selectedNetwork} does not support this method!`);
  }

  async transfer(args: TransferParams) {
    const { request } = args;

    if (this.selectedNetwork === 'ethereum') {
      const { client, ethSigner, starkSigner } = getIMXElements(this.keys);

      return await client.transfer(
        {
          ethSigner,
          starkSigner,
        },
        request,
      );
    }

    if (this.selectedNetwork === 'imxZkEVM' && request.type === 'ERC20') {
      const { zkEVMSigner } = getzkEVMElements(this.keys);

      const amount = request.amount;

      const tx = await zkEVMSigner.sendTransaction({
        to: request.receiver,
        value: amount,
        maxFeePerGas: 15e9,
        gasLimit: 200000,
        maxPriorityFeePerGas: 10e9,
      });
      await tx.wait();
      return;
    }

    throw new Error(`${this.selectedNetwork} does not support this method!`);
  }
}
