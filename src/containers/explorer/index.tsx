import React, { useMemo, useState, useContext } from 'react';
import clsx from 'clsx';

// components
import { ToastContainer, toast } from 'react-toastify';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ConnectWallet from './connectWallet';
import ActionSheets, { SelectedTab } from './actionSheets';

// contexts
import { ExplorerContext } from './contexts';

// utils
import { randomString, toShortAddress } from '../../utils/string';

// types
import { getIMXElements } from '../../services/imx.service';

// styles
import useStyles from './styles';

type MenuItem = {
  label: string;
  value: SelectedTab;
};

const ExplorerPage: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<SelectedTab>('transfer');

  const { selectedClient, onSetSelectedClient, clients } = useContext(ExplorerContext);

  const onConnectWallet = (walletPk: string, starkPk: string) => {
    try {
      const clientSet = getIMXElements({
        walletPrivateKey: walletPk,
      });

      onSetSelectedClient({
        ...clientSet,
        starkPrivateKey: starkPk,
        id: randomString(),
      });
    } catch (error: any) {
      toast(error.message, {
        type: 'error',
      });
    }
  };

  const onLogout = () => {
    onSetSelectedClient();
  };

  const onChangeSelectedClient = (event: SelectChangeEvent<string>) => {
    const existClient = clients.find((client) => client.id === event.target.value);
    onSetSelectedClient(existClient);
  };

  const renderLoadedClients = useMemo(() => {
    return clients.map((client, index) => (
      <MenuItem value={client.id} key={index}>
        {`${client.walletName} (${toShortAddress(client.wallet.address)})`}
      </MenuItem>
    ));
  }, [clients]);

  const renderLeftMenus = useMemo(() => {
    return menus.map((item, index) => (
      <div
        className={clsx(styles.menuItem, {
          [styles.activeItem]: item.value === selectedTab,
        })}
        onClick={() => setSelectedTab(item.value)}
        key={index}
      >
        {item.label}
      </div>
    ));
  }, [menus, selectedTab]);

  return (
    <Box className={styles.root}>
      <div>
        <Typography variant="h2" className={styles.heading}>
          Explorer
        </Typography>

        <Box mt={8}>
          {selectedClient ? (
            <Box>
              <div>
                {clients.length > 0 ? (
                  <Box>
                    <Select
                      size="small"
                      value={selectedClient.id}
                      onChange={onChangeSelectedClient}
                    >
                      {renderLoadedClients}
                    </Select>
                  </Box>
                ) : (
                  <div>Connected wallet: {selectedClient.wallet.address}</div>
                )}
              </div>

              <IconButton onClick={onLogout}>
                <LogoutIcon color="error" />
              </IconButton>
            </Box>
          ) : (
            <ConnectWallet onConnectWallet={onConnectWallet} />
          )}
        </Box>

        <Grid container spacing={4} mt={0}>
          <Grid item xs={4}>
            <div className={styles.leftMenuContainer}>{renderLeftMenus}</div>
          </Grid>

          <Grid item xs={8}>
            <ActionSheets selectedTab={selectedTab} />
          </Grid>
        </Grid>
      </div>

      <ToastContainer />
    </Box>
  );
};

export default ExplorerPage;

const menus: MenuItem[] = [
  {
    label: 'transfer',
    value: 'transfer',
  },
  {
    label: 'transferNFTMultiple',
    value: 'transfer-nft-multiple',
  },
  {
    label: 'transferToMainWallet',
    value: 'transfer-to-main-wallet',
  },
  {
    label: 'transferToSubWallets',
    value: 'transfer-to-sub-wallets',
  },
  {
    label: 'buy',
    value: 'buy',
  },
  {
    label: 'sell',
    value: 'sell',
  },
  {
    label: 'getBalance',
    value: 'getBalance',
  },
  {
    label: 'listAssets',
    value: 'listAssets',
  },
  {
    label: 'getOrders',
    value: 'getOrders',
  },
];
