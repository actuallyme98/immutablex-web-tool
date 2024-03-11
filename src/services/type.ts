import {
  UnsignedTransferRequest,
  UnsignedOrderRequest,
  GetSignableTradeRequest,
} from '@imtbl/core-sdk';

export type SellParams = {
  request: UnsignedOrderRequest;
};

export type BuyParams = {
  request: PickWithOptional<GetSignableTradeRequest, 'user'>;
};

export type TransferParams = {
  request: UnsignedTransferRequest;
};
