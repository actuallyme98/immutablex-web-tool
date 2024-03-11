import { createTypeReducer } from '../type-redux';
import * as AppActions from '../actions/app.action';
import { SelectedNetworkType } from '../../types/store/app';

export type State = {
  selectedNetwork: SelectedNetworkType;
};

export const initialState: State = {
  selectedNetwork: 'ethereum',
};

export const setBackdropLoadingReducer = AppActions.setSelectedNetwork.reducer<State>(
  (state, action) => ({
    selectedNetwork: action.payload,
  }),
);

export const reducer = createTypeReducer(initialState, setBackdropLoadingReducer);
