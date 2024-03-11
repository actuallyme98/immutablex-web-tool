/* eslint-disable @typescript-eslint/no-empty-function */
import React, { useState } from 'react';

// types
import { ConnectedService } from '../../../types/local-storage';

type ExplorerContextState = {
  selectedClient?: ConnectedService;
  onSetSelectedClient: (client?: ConnectedService) => void;
  clients: ConnectedService[];
  onSetClients: (clients: ConnectedService[]) => void;
};

const initialState: ExplorerContextState = {
  onSetSelectedClient: () => {},
  clients: [],
  onSetClients: () => {},
};

export const ExplorerContext = React.createContext<ExplorerContextState>(initialState);

export const ExplorerContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [selectedClient, setSelectedClient] = useState<ConnectedService>();
  const [clients, setClients] = useState<ConnectedService[]>([]);

  const onSetSelectedClient = (newClient?: ConnectedService) => {
    setSelectedClient(newClient);
  };

  const onSetClients = (newClients: ConnectedService[]) => {
    setClients(newClients);
    setSelectedClient(
      newClients.find((c) => c.privateKey === selectedClient?.privateKey) || newClients[0],
    );
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
