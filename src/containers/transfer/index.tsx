import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

// components
import { ToastContainer } from 'react-toastify';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import GasConfig from './gasConfig';
import ActionSheets, { SelectedTab } from './actionSheets';

// styles
import useStyles from './styles';

type MenuItem = {
  label: string;
  value: SelectedTab;
};

const TransferPage: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<SelectedTab>('transfer-nft-multiple');
  const [maxFeePerGas, setMaxFeePerGas] = useState('50');
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState('25');
  const [gasLimit, setGasLimit] = useState('300000');

  const onChangeMaxFeePerGas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setMaxFeePerGas(value);
  };

  const onChangeMaxPriorityFeePerGas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setMaxPriorityFeePerGas(value);
  };

  const onChangeGasLimit = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGasLimit(value);
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
          Transfer multiple
        </Typography>

        <Box mt={8}>
          <GasConfig
            gasLimit={gasLimit}
            onChangeGasLimit={onChangeGasLimit}
            maxFeePerGas={maxFeePerGas}
            onChangeMaxFeePerGas={onChangeMaxFeePerGas}
            maxPriorityFeePerGas={maxPriorityFeePerGas}
            onChangeMaxPriorityFeePerGas={onChangeMaxPriorityFeePerGas}
          />
        </Box>

        <Grid container spacing={4} mt={0}>
          <Grid item xs={4}>
            <div className={styles.leftMenuContainer}>{renderLeftMenus}</div>
          </Grid>

          <Grid item xs={8}>
            <ActionSheets
              selectedTab={selectedTab}
              gasOptions={{
                gasLimit: gasLimit ? parseFloat(gasLimit) : 300000,
                maxFeePerGas: maxFeePerGas ? parseFloat(maxFeePerGas) * 1e9 : 25e9,
                maxPriorityFeePerGas: maxPriorityFeePerGas
                  ? parseFloat(maxPriorityFeePerGas) * 1e9
                  : 50e9,
              }}
            />
          </Grid>
        </Grid>
      </div>

      <ToastContainer />
    </Box>
  );
};

export default TransferPage;

const menus: MenuItem[] = [
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
];
