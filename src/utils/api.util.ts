import axios from 'axios';
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
