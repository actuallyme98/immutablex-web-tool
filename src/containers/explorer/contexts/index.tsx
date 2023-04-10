/* eslint-disable @typescript-eslint/no-empty-function */
import React, { useState } from 'react';

import { ClientSet } from '../../../services/imx.service';

export type ConnectedWallet = ClientSet & {
  starkPk: string;
};

type ExplorerContextState = {
  connectedWallet?: ConnectedWallet;
  onChangeConnectedWallet: (connectedWallet?: ConnectedWallet) => void;
};

const initialState: ExplorerContextState = {
  onChangeConnectedWallet: () => {},
};

export const ExplorerContext = React.createContext<ExplorerContextState>(initialState);

export const ExplorerContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet>();

  const onChangeConnectedWallet = (newConnectedWallet?: ConnectedWallet) => {
    setConnectedWallet(newConnectedWallet);
  };

  return (
    <ExplorerContext.Provider
      value={{
        connectedWallet,
        onChangeConnectedWallet,
      }}
    >
      {children}
    </ExplorerContext.Provider>
  );
};
