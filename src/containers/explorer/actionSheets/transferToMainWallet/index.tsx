import React, { useState, useMemo } from 'react';
import clsx from 'clsx';

import readXlsxFile from 'read-excel-file';
import * as ethers from 'ethers';

// comonents
import { ToastContainer } from 'react-toastify';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import SubmitButton from '../../../../components/SubmitButton';
import TextField from '../../../../components/TextField';

import { useSelector } from 'react-redux';
import { sSelectedNetwork } from '../../../../redux/selectors/app.selector';

// services
import { ImmutableService } from '../../../../services';

// utils
import { fromCsvToUsers } from '../../../../utils/format.util';

// consts
import { IMX_ADDRESS } from '../../../../constants/imx';

// types
import { TradingService } from '../../../../types/local-storage';

// styles
import useStyles from './styles';

type CustomLog = {
  title: string;
  type?: 'error' | 'info' | 'warning' | 'success';
};

const TransferToMainWalletTab: React.FC = () => {
  const [clients, setClients] = useState<TradingService[]>([]);
  const [logs, setLogs] = useState<CustomLog[]>([]);
  const [address, setAddress] = useState('');
  const [isTradeSubmitting, setIsTradeSubmitting] = useState(false);

  const selectedNetwork = useSelector(sSelectedNetwork);

  const styles = useStyles();

  const onChangeFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const rows = await readXlsxFile(file);

    const formattedUsers = fromCsvToUsers(rows);

    try {
      formattedUsers.forEach((user) => {
        const service = new ImmutableService(
          selectedNetwork,
          user.privateKey,
          user.starkPrivateKey,
        );

        setClients((prev) =>
          prev.concat({
            service,
            ...user,
          }),
        );
      });
    } catch (error) {
      //
    }
  };

  const onChangeAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setAddress(value);
  };

  const pushLog = (item: CustomLog) => {
    setLogs((prev) => prev.concat(item));
  };

  const etherToWei = (unit: string) => {
    return ethers.parseUnits(unit, 'ether').toString();
  };

  const weiToEther = (unit: string) => {
    return ethers.formatEther(unit);
  };

  const onSubmitTransfer = async () => {
    try {
      if (clients.length === 0 || !address) return;

      for (const selectedClient of clients) {
        try {
          const { service } = selectedClient;
          const ethAddress = service.getAddress();

          pushLog({
            title: `Select address: ${ethAddress}`,
          });

          const balanceResponse = await service.getBalance(ethAddress);
          const { balance: ethAmount } = balanceResponse;

          pushLog({
            title: `Starting transfer ${ethAmount} IMX to ${address}`,
          });

          await service.transfer({
            request: {
              receiver: address,
              amount: etherToWei(ethAmount),
              type: 'ERC20',
              tokenAddress: IMX_ADDRESS,
            },
          });

          pushLog({
            title: 'Transfer success!',
            type: 'success',
          });
        } catch (error: any) {
          pushLog({
            title: error.message,
            type: 'error',
          });
          pushLog({
            title: `Skip current client`,
            type: 'warning',
          });
          continue;
        }
      }
    } catch (error: any) {
      pushLog({
        title: error.message,
        type: 'error',
      });
    } finally {
      pushLog({
        title: 'End session!',
      });
      setIsTradeSubmitting(false);
    }
  };

  const renderLogs = useMemo(() => {
    return logs.map((item, index) => (
      <code
        key={index}
        className={clsx(styles.logLine, {
          [styles.logLineError]: item.type === 'error',
          [styles.logLineSuccess]: item.type === 'success',
          [styles.logLineWarning]: item.type === 'warning',
        })}
      >
        {`[${index}]:`} {item.title}
      </code>
    ));
  }, [logs]);

  return (
    <Box>
      <ToastContainer />
      <Typography mb={2}>Transfer to main wallet</Typography>
      <Divider />
      <Grid container spacing={2} mt={0}>
        <Grid item xs={12}>
          <input type="file" onChange={onChangeFile} accept=".csv, .xlsx" />
        </Grid>

        <Grid item xs={12}>
          <label className={styles.label}>Receiver</label>
          <TextField name="receiver" value={address} onChange={onChangeAddress} />
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        <Grid item xs={12}>
          <SubmitButton
            onClick={onSubmitTransfer}
            disabled={clients.length === 0 || !address || isTradeSubmitting}
            isLoading={isTradeSubmitting}
          >
            Submit
          </SubmitButton>
        </Grid>

        {logs.length > 0 && (
          <Grid item xs={12}>
            <Box className={styles.logsContainer}>{renderLogs}</Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default TransferToMainWalletTab;
