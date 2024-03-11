import {
  combineReducers,
  applyMiddleware,
  Store as ReduxStore,
  legacy_createStore as createStore,
} from 'redux';
import promiseMiddleware from 'redux-promise';
import {
  typePendingReducerSet,
  createTypeReduxInitialState,
  typeReduxMiddleware,
} from './type-redux';

import * as AppReducer from './reducers/app.reducer';

export interface RootState {
  appState: AppReducer.State;
}

export type Store = ReduxStore<RootState>;

export const rootReducer = combineReducers<RootState>({
  ...typePendingReducerSet,
  appState: AppReducer.reducer,
});

export const InitialState: RootState = Object.assign(createTypeReduxInitialState(), {
  appState: AppReducer.initialState,
});

export const resetTypeReduxState = (state: RootState) => ({
  ...state,
  ...createTypeReduxInitialState(),
});

const middlewares: any[] = [typeReduxMiddleware, promiseMiddleware];

export const configureStore = (initialState?: RootState) => {
  return createStore(
    rootReducer,
    { ...InitialState, ...initialState },
    applyMiddleware(...middlewares),
  );
};
