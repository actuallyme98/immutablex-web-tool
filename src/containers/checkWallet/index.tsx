import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

import readXlsxFile from 'read-excel-file';

// components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import SubmitButton from '../../components/SubmitButton';

// services
import { ImmutableService } from '../../services';

// utils
import { fromCsvToUsers } from '../../utils/format.util';
import { delay } from '../../utils/system';

// types
import { TradingServiceV3, TradingService } from '../../types/local-storage';

// styles
import useStyles from './styles';

type CustomLog = {
  title: string;
  type?: 'error' | 'info' | 'warning' | 'success';
};

const delayTime = 180000;
const NOT_FOUND_NETWORK_ERROR_MESSAGE = 'could not detect network';

const CheckWalletPage: React.FC = () => {
  const styles = useStyles();
  const [fileAndClients, setFileAndClients] = useState<TradingServiceV3[]>([]);
  const [logs, setLogs] = useState<CustomLog[]>([]);
  const [isTradeSubmitting, setIsTradeSubmitting] = useState(false);

  const onChangeFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const importedFiles = event.target.files || [];
    const newFiles = Array.from(importedFiles);

    const updatedClients = await Promise.all(
      newFiles.map(async (file) => {
        const rows = await readXlsxFile(file);
        const formattedUsers = fromCsvToUsers(rows);

        return {
          fileName: file.name,
          clients: formattedUsers.map((user) => {
            const service = new ImmutableService('imxZkEVM', user.privateKey, user.starkPrivateKey);
            return {
              ...user,
              service,
            };
          }),
        };
      }),
    );

    setFileAndClients(updatedClients);

    event.target.value = '';
  };

  const pushLog = (item: CustomLog) => {
    setLogs((prev) => prev.concat(item));
  };

  const onCheckWallet = async (clients: TradingService[]) => {
    for (const client of clients) {
      const { service } = client;
      const ethAddress = service.getAddress();

      pushLog({
        title: `Selected Address: ${ethAddress}`,
      });
      let totalBalance = '0';

      let retryCount = 10;
      while (retryCount > 0) {
        try {
          const { balance } = await service.getBalance();
          totalBalance = balance;
          break;
        } catch (error: any) {
          pushLog({
            title: error.message,
            type: 'error',
          });

          if (
            error.message?.includes(NOT_FOUND_NETWORK_ERROR_MESSAGE) ||
            error.message?.includes('code=SERVER_ERROR')
          ) {
            pushLog({
              title: `Wait for 3m after try again ....`,
              type: 'warning',
            });
            await delay(delayTime);
          }

          retryCount--;
          if (retryCount === 0) {
            throw new Error(`Failed to getBalance after ${retryCount} retries for ${ethAddress}`);
          }
        }
      }

      const isMatch = parseFloat(totalBalance) > 20;

      if (isMatch) {
        pushLog({
          title: '----------------------------------------------------------------',
          type: 'error',
        });
        pushLog({
          title: '----------------------------------------------------------------',
          type: 'error',
        });
        pushLog({
          title: '----------------------------------------------------------------',
          type: 'error',
        });
      }

      pushLog({
        title: `${ethAddress} has balance of ${totalBalance} IMX`,
        type: isMatch ? 'error' : 'success',
      });

      if (isMatch) {
        pushLog({
          title: '----------------------------------------------------------------',
          type: 'error',
        });
        pushLog({
          title: '----------------------------------------------------------------',
          type: 'error',
        });
        pushLog({
          title: '----------------------------------------------------------------',
          type: 'error',
        });
      }
    }
  };

  const onStartTrade = async () => {
    const start = Date.now();
    if (fileAndClients.length === 0) return;

    try {
      setIsTradeSubmitting(true);
      pushLog({
        title: 'Start session ...',
      });

      for (const fileAndClient of fileAndClients) {
        pushLog({
          title: `------------- Selected file ${fileAndClient.fileName} -------------`,
          type: 'warning',
        });
        await onCheckWallet(fileAndClient.clients);
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
      const end = Date.now();
      pushLog({
        title: `Execution time: ${end - start} ms`,
        type: 'success',
      });
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
    <Box className={styles.root}>
      <Box width="100%">
        <Typography variant="h2" textAlign="center" mb={4}>
          Check wallet
        </Typography>

        {fileAndClients.length === 0 ? (
          <Box>
            <input type="file" onChange={onChangeFile} accept=".csv, .xlsx" multiple />
          </Box>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={4}>
              <Typography mb={2}>Loaded files</Typography>
              <Box>
                {fileAndClients.map((f, i) => (
                  <Box key={i}>{f.fileName}</Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={8}>
              <Box>
                <SubmitButton
                  variant="contained"
                  onClick={onStartTrade}
                  isLoading={isTradeSubmitting}
                  disabled={isTradeSubmitting}
                >
                  Check
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

export default CheckWalletPage;
