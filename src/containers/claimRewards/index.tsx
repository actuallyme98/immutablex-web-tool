import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import readXlsxFile from 'read-excel-file';

// components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import SubmitButton from '../../components/SubmitButton';

import { useSelector } from 'react-redux';
import { sSelectedNetwork } from '../../redux/selectors/app.selector';

// services
import { ImmutableService } from '../../services';

// utils
import { fromCsvToUsers } from '../../utils/format.util';
import { delay } from '../../utils/system';
import { claimPointsForWallet } from '../../utils/api.util';

// types
import { TradingService } from '../../types/local-storage';

// styles
import useStyles from './styles';

type CustomLog = {
  title: string;
  type?: 'error' | 'info' | 'warning' | 'success';
};

const ClaimRewardsPage: React.FC = () => {
  const styles = useStyles();
  const [clients, setClients] = useState<TradingService[]>([]);
  const [logs, setLogs] = useState<CustomLog[]>([]);
  const [isTradeSubmitting, setIsTradeSubmitting] = useState(false);

  const selectedNetwork = useSelector(sSelectedNetwork);

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

    event.target.value = '';
  };

  const pushLog = (item: CustomLog) => {
    setLogs((prev) => prev.concat(item));
  };

  const onStartTrade = async () => {
    const start = Date.now();
    if (clients.length === 0) return;
    let totalPoints = 0;

    try {
      setIsTradeSubmitting(true);
      pushLog({
        title: 'Start session ...',
      });

      for (const client of clients) {
        const { service } = client;
        const { ethSigner } = service.getElements();
        const ethAddress = service.getAddress();

        pushLog({
          title: `Selected Address: ${ethAddress}`,
        });

        let retryCount = 2;
        let points = '0';
        while (retryCount > 0) {
          try {
            points = await claimPointsForWallet(ethSigner);
            break;
          } catch (error: any) {
            pushLog({
              title: `Error claiming points for ${ethAddress}. Retrying...`,
              type: 'error',
            });
            pushLog({
              title: JSON.stringify(error.response || error.message),
              type: 'error',
            });
            retryCount--;
            await delay(1000);
            if (retryCount === 0) {
              pushLog({
                title: `Failed to claim points after ${retryCount} retries for ${ethAddress}`,
              });
              continue;
            }
          }
        }

        pushLog({
          title: `Claimed: ${points}`,
          type: 'success',
        });

        totalPoints += parseFloat(points);
      }
    } catch (error: any) {
      pushLog({
        title: error.message,
        type: 'error',
      });
    } finally {
      pushLog({
        title: `------- Total rewards claimed: ${totalPoints} -------`,
        type: 'success',
      });
      setIsTradeSubmitting(false);
      const end = Date.now();
      pushLog({
        title: `Execution time: ${end - start} ms`,
        type: 'success',
      });
    }
  };

  const renderClients = useMemo(() => {
    return clients.map((item, index) => <Alert key={index}>{item.service.getAddress()}</Alert>);
  }, [clients]);

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
    setClients(
      clients.map((client) => ({
        ...client,
        service: new ImmutableService(selectedNetwork, client.privateKey, client.starkPrivateKey),
      })),
    );
  }, [selectedNetwork]);

  return (
    <Box className={styles.root}>
      <Box width="100%">
        <Typography variant="h2" textAlign="center" mb={4}>
          Claim Rewards
        </Typography>

        {clients.length === 0 ? (
          <Box>
            <input type="file" onChange={onChangeFile} accept=".csv, .xlsx" />
          </Box>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={4}>
              <Typography mb={2}>Loaded users</Typography>
              <Stack spacing={2}>{renderClients}</Stack>
            </Grid>

            <Grid item xs={8}>
              <Box>
                <SubmitButton
                  variant="contained"
                  onClick={onStartTrade}
                  isLoading={isTradeSubmitting}
                  disabled={isTradeSubmitting}
                >
                  Claim Rewards
                </SubmitButton>
              </Box>

              <Box className={styles.logsContainer}>{renderLogs}</Box>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default ClaimRewardsPage;
