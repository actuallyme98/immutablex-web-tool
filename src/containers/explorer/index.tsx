import React, { useMemo, useState, useContext } from 'react';
import clsx from 'clsx';

// components
import { ToastContainer, toast } from 'react-toastify';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';
import ConnectWallet from './connectWallet';
import ActionSheets, { SelectedTab } from './actionSheets';

// contexts
import { ExplorerContext } from './contexts';

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

  const { connectedWallet, onChangeConnectedWallet } = useContext(ExplorerContext);

  const onConnectWallet = (walletPk: string, starkPk: string) => {
    try {
      const clientSet = getIMXElements({
        walletPrivateKey: walletPk,
      });

      onChangeConnectedWallet({
        ...clientSet,
        starkPk,
      });
    } catch (error: any) {
      toast(error.message, {
        type: 'error',
      });
    }
  };

  const onLogout = () => {
    onChangeConnectedWallet();
  };

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
          {connectedWallet ? (
            <Box>
              <div>Connected wallet: {connectedWallet.wallet.address}</div>

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
];
