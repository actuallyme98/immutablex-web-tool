import { SelectedNetworkOption } from '../types/store/app';

export const SELECTED_NETWORK_OPTIONS: SelectedNetworkOption[] = [
  {
    value: 'ethereum',
    label: 'Ethereum',
  },
  {
    value: 'imxZkEVM',
    label: 'Immutable zkEVM',
  },
];

export const X_REWARD_POOL_ENDPOINT =
  'https://api.x.immutable.com/v1/rewards/cycle/current?chain_id=imtbl-x';
export const ZKEVM_REWARD_POOL_ENDPOINT =
  'https://api.x.immutable.com/v1/rewards/cycle/current?chain_id=imtbl-x';
