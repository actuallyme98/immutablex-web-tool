/* eslint-disable @typescript-eslint/no-empty-function */
import React, { useState } from 'react';

// types
import { ConnectedWallet } from '../../../types/local-storage';

type ExplorerContextState = {
  selectedClient?: ConnectedWallet;
  onSetSelectedClient: (client?: ConnectedWallet) => void;
  clients: ConnectedWallet[];
  onSetClients: (clients: ConnectedWallet[]) => void;
};

const initialState: ExplorerContextState = {
  onSetSelectedClient: () => {},
  clients: [],
  onSetClients: () => {},
};

export const ExplorerContext = React.createContext<ExplorerContextState>(initialState);

export const ExplorerContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [selectedClient, setSelectedClient] = useState<ConnectedWallet>();
  const [clients, setClients] = useState<ConnectedWallet[]>([]);

  const onSetSelectedClient = (newClient?: ConnectedWallet) => {
    setSelectedClient(newClient);
  };

  const onSetClients = (newClients: ConnectedWallet[]) => {
    setClients(newClients);
  };

  return (
    <ExplorerContext.Provider
      value={{
        selectedClient,
        onSetSelectedClient,
        clients,
        onSetClients,
      }}
    >
      {children}
    </ExplorerContext.Provider>
  );
};
