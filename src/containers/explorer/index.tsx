import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

// components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { ToastContainer, toast } from 'react-toastify';
import ConnectWallet from './connectWallet';
import ActionSheets, { SelectedTab } from './actionSheets';

// types
import { ClientSet, getIMXElements } from '../../services/imx.service';

// styles
import useStyles from './styles';

type MenuItem = {
  label: string;
  value: SelectedTab;
};

const ExplorerPage: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<SelectedTab>('transfer');
  const [connectedWallet, setConnectedWallet] = useState<
    ClientSet & {
      starkPk: string;
    }
  >();

  const onConnectWallet = (walletPk: string, starkPk: string) => {
    try {
      const clientSet = getIMXElements({
        walletPrivateKey: walletPk,
      });

      setConnectedWallet({
        ...clientSet,
        starkPk,
      });
    } catch (error: any) {
      toast(error.message, {
        type: 'error',
      });
    }
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
          <ConnectWallet onConnectWallet={onConnectWallet} />
        </Box>

        <Grid container spacing={4} mt={8}>
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
    label: 'getBalance',
    value: 'getBalance',
  },
  {
    label: 'listAssets',
    value: 'listAssets',
  },
];
