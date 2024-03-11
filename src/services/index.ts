import { getIMXElements } from './imx.service';
import { getzkEVMElements } from './zkEVM.service';

import { SelectedNetworkType } from '../types/store/app';

import { IMX_ADDRESS } from '../constants/imx';

import { BuyParams, SellParams, TransferParams } from './type';

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

    if (this.selectedNetwork === 'polygon') {
      const { ethSigner } = getzkEVMElements(this.keys);

      return ethSigner.address;
    }

    return '';
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

    if (this.selectedNetwork === 'polygon') {
      const { imxProvider } = getzkEVMElements(this.keys);

      return imxProvider.createOrder(request);
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

    if (this.selectedNetwork === 'polygon') {
      const { imxProvider, ethSigner } = getzkEVMElements(this.keys);

      return await imxProvider.createTrade({
        ...request,
        user: request.user || ethSigner.address,
      });
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

      return response;
    }

    if (this.selectedNetwork === 'polygon') {
      const { balancesApi, ethSigner } = getzkEVMElements(this.keys);

      const response = await balancesApi.getBalance({
        address: IMX_ADDRESS,
        owner: owner || ethSigner.address,
      });

      return response.data;
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

    if (this.selectedNetwork === 'polygon') {
      const { ordersApi, ethSigner } = getzkEVMElements(this.keys);

      const response = await ordersApi.listOrdersV3({
        user: owner || ethSigner.address,
        status: 'active',
      });

      return response.data;
    }

    throw new Error(`${this.selectedNetwork} does not support this method!`);
  }

  async cancelOrder(orderId: number) {
    if (this.selectedNetwork === 'ethereum') {
      const { client, ethSigner, starkSigner } = getIMXElements(this.keys);

      return await client.cancelOrder(
        {
          ethSigner,
          starkSigner,
        },
        {
          order_id: orderId,
        },
      );
    }

    if (this.selectedNetwork === 'polygon') {
      const { imxProvider } = getzkEVMElements(this.keys);

      return imxProvider.cancelOrder({
        order_id: orderId,
      });
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

    if (this.selectedNetwork === 'polygon') {
      const { assetsApi, ethSigner } = getzkEVMElements(this.keys);

      const response = await assetsApi.listAssets({
        user: owner || ethSigner.address,
      });

      return response.data;
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

    if (this.selectedNetwork === 'polygon') {
      const { imxProvider } = getzkEVMElements(this.keys);

      return await imxProvider.transfer(request);
    }

    throw new Error(`${this.selectedNetwork} does not support this method!`);
  }
}
