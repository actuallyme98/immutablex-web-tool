import React, { useEffect, useState, useMemo } from 'react';
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

const TransferToSubWalletsTab: React.FC = () => {
  const [clients, setClients] = useState<TradingService[]>([]);
  const [logs, setLogs] = useState<CustomLog[]>([]);
  const [amount, setAmount] = useState('');
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

  const onChangeAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setAmount(value);
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
      if (clients.length === 0 || !amount) return;

      for (const selectedClient of clients) {
        try {
          const { service, targetWallet } = selectedClient;
          const ethAddress = service.getAddress();

          pushLog({
            title: `Select address: ${ethAddress}`,
          });

          if (!targetWallet) {
            pushLog({
              title: `Missing target_wallet`,
              type: 'warning',
            });
            continue;
          }

          pushLog({
            title: `Starting transfer ${amount} IMX to ${targetWallet}`,
          });

          await service.transfer({
            request: {
              receiver: targetWallet,
              amount: etherToWei(amount),
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

  useEffect(() => {
    setClients((prev) =>
      prev.map((client) => ({
        ...client,
        service: new ImmutableService(selectedNetwork, client.privateKey, client.starkPrivateKey),
      })),
    );
  }, [selectedNetwork]);

  return (
    <Box>
      <ToastContainer />
      <Typography mb={2}>Transfer to sub wallets</Typography>
      <Divider />
      <Grid container spacing={2} mt={0}>
        <Grid item xs={12}>
          <input type="file" onChange={onChangeFile} accept=".csv, .xlsx" />
        </Grid>

        <Grid item xs={12}>
          <label className={styles.label}>Amount</label>
          <TextField name="amount" value={amount} onChange={onChangeAmount} />
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        <Grid item xs={12}>
          <SubmitButton
            onClick={onSubmitTransfer}
            disabled={clients.length === 0 || !amount || isTradeSubmitting}
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

export default TransferToSubWalletsTab;
