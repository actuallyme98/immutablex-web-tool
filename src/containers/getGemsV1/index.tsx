import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

import readXlsxFile from 'read-excel-file';

// components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import SubmitButton from '../../components/SubmitButton';

import { useSelector } from 'react-redux';
import { sSelectedNetwork } from '../../redux/selectors/app.selector';

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

const GetGemsV1Page: React.FC = () => {
  const styles = useStyles();
  const [fileAndClients, setFileAndClients] = useState<TradingServiceV3[]>([]);
  const [logs, setLogs] = useState<CustomLog[]>([]);
  const [isTradeSubmitting, setIsTradeSubmitting] = useState(false);

  const selectedNetwork = useSelector(sSelectedNetwork);

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
            const service = new ImmutableService(
              selectedNetwork,
              user.privateKey,
              user.starkPrivateKey,
            );
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

  const onGetGems = async (clients: TradingService[]) => {
    for (const client of clients) {
      const { service } = client;
      const ethAddress = service.getAddress();

      pushLog({
        title: `Selected Address: ${ethAddress}`,
      });

      let retryCount = 10;
      while (retryCount > 0) {
        try {
          await service.getGem();
          break;
        } catch (error: any) {
          pushLog({
            title: error.message,
            type: 'error',
          });
          retryCount--;
          await delay(1000);
          if (retryCount === 0) {
            throw new Error(`Failed to getGem after ${retryCount} retries for ${ethAddress}`);
          }
        }
      }

      pushLog({
        title: `${ethAddress} get 1 Gem success!`,
        type: 'success',
      });
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
        await onGetGems(fileAndClient.clients);

        pushLog({
          title: 'Delay 3m ....',
          type: 'warning',
        });
        await delay(delayTime);
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
          Get Gems
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
                  Get Gems
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

export default GetGemsV1Page;
