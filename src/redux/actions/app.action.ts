import { createTypeAction } from '../type-redux';
import { SelectedNetworkType } from '../../types/store/app';

export const setSelectedNetwork = createTypeAction<SelectedNetworkType, SelectedNetworkType>(
  'SET_SELECTED_NETWORK',
  (selectedNetwork) => selectedNetwork,
);
