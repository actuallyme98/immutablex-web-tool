import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { parseUnits } from 'ethers';

import readXlsxFile from 'read-excel-file';

// components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
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

const GetGemsV2Page: React.FC = () => {
  const styles = useStyles();
  const [fileAndClients, setFileAndClients] = useState<TradingServiceV3[]>([]);
  const [logs, setLogs] = useState<CustomLog[]>([]);
  const [isTradeSubmitting, setIsTradeSubmitting] = useState(false);

  const [sellAmount, setSellAmount] = useState('20');

  const [maxFeePerGas, setMaxFeePerGas] = useState('15');
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState('10');
  const [gasLimit, setGasLimit] = useState('35000');

  const [tmaxFeePerGas, setTMaxFeePerGas] = useState('15');
  const [tmaxPriorityFeePerGas, setTMaxPriorityFeePerGas] = useState('10');
  const [tgasLimit, setTGasLimit] = useState('40000');

  const onChangeSellAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSellAmount(value);
  };

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

  const onChangeTMaxFeePerGas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTMaxFeePerGas(value);
  };

  const onChangeTMaxPriorityFeePerGas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTMaxPriorityFeePerGas(value);
  };

  const onChangeTGasLimit = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTGasLimit(value);
  };

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

  const etherToWei = (amount: string) => {
    return parseUnits(amount, 'ether').toString();
  };

  const triggerTransfer = async (
    service: ImmutableService,
    targetAddress: string,
    retryCount = 10,
  ) => {
    const ethAddress = service.getAddress();

    const minRequiredBalance = sellAmount || '20';

    let retryAttempts = 0;

    pushLog({
      title: `Starting transfer ${minRequiredBalance} IMX to ${ethAddress}`,
    });

    const gasOptions = {
      maxPriorityFeePerGas: tmaxPriorityFeePerGas ? parseFloat(tmaxPriorityFeePerGas) * 1e9 : 10e9,
      maxFeePerGas: tmaxFeePerGas ? parseFloat(tmaxFeePerGas) * 1e9 : 15e9,
      gasLimit: tgasLimit ? parseFloat(tgasLimit) : 40000,
    };

    while (retryAttempts < retryCount) {
      try {
        await service.transfer(
          {
            request: {
              type: 'ERC20',
              receiver: targetAddress,
              amount: etherToWei(minRequiredBalance),
              tokenAddress: '',
            },
          },
          gasOptions,
        );

        pushLog({
          title: 'Transfer success!',
          type: 'success',
        });

        break;
      } catch (error: any) {
        retryAttempts++;

        pushLog({
          title: `Transfer attempt ${retryAttempts} failed: ${error.message}`,
          type: 'error',
        });

        if (error.message?.includes(NOT_FOUND_NETWORK_ERROR_MESSAGE)) {
          pushLog({
            title: `Wait for 3m after try again ....`,
            type: 'warning',
          });
          await delay(delayTime);
        }

        if (retryAttempts === retryCount) {
          pushLog({
            title: `Maximum retry attempts reached (${retryCount}). Transfer failed.`,
            type: 'error',
          });

          throw new Error('Transfer failed after maximum retry attempts.');
        }

        await delay(1000);
      }
    }
  };

  const onGetGems = async (clients: TradingService[]) => {
    const rootWallet = clients[0];
    let poolClient = clients[0];

    for (const client of clients) {
      const { service } = client;
      const poolAddress = poolClient.service.getAddress();
      const ethAddress = service.getAddress();

      if (poolAddress !== ethAddress) {
        await triggerTransfer(poolClient.service, ethAddress);
        await delay(2000); // delay 2s
      }

      pushLog({
        title: `Selected Address: ${ethAddress}`,
      });

      const gasOptions = {
        maxPriorityFeePerGas: maxPriorityFeePerGas ? parseFloat(maxPriorityFeePerGas) * 1e9 : 10e9,
        maxFeePerGas: maxFeePerGas ? parseFloat(maxFeePerGas) * 1e9 : 15e9,
        gasLimit: gasLimit ? parseFloat(gasLimit) : 35000,
      };

      let retryCount = 10;
      while (retryCount > 0) {
        try {
          await service.getGem(gasOptions);
          poolClient = client;
          break;
        } catch (error: any) {
          pushLog({
            title: error.message,
            type: 'error',
          });

          if (error.message?.includes(NOT_FOUND_NETWORK_ERROR_MESSAGE)) {
            pushLog({
              title: `Wait for 3m after try again ....`,
              type: 'warning',
            });
            await delay(delayTime);
          }

          retryCount--;
          await delay(1000);
          if (retryCount === 0) {
            throw new Error(`Failed to getGem after ${retryCount} retries for ${ethAddress}`);
          }
        }
      }

      pushLog({
        title: `${ethAddress} get 3 Gem success!`,
        type: 'success',
      });
    }

    const rootAddress = rootWallet.service.getAddress();
    const poolAddress = poolClient.service.getAddress();
    if (rootAddress !== poolAddress) {
      await triggerTransfer(poolClient.service, rootAddress);
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
              <Box mt={2} mb={2}>
                Gas options (Trade - Transfer)
              </Box>
              <Box mb={1}>
                <TextField
                  size="small"
                  label="maxFeePerGas"
                  type="number"
                  className={styles.gasOptionInput}
                  value={maxFeePerGas}
                  onChange={onChangeMaxFeePerGas}
                  autoComplete="off"
                />

                <TextField
                  size="small"
                  label="maxFeePerGas"
                  type="number"
                  className={styles.gasOptionInput}
                  style={{ marginLeft: 12 }}
                  value={tmaxFeePerGas}
                  onChange={onChangeTMaxFeePerGas}
                  autoComplete="off"
                />
              </Box>

              <Box mb={1}>
                <TextField
                  size="small"
                  label="maxPriorityFeePerGas"
                  type="number"
                  className={styles.gasOptionInput}
                  value={maxPriorityFeePerGas}
                  onChange={onChangeMaxPriorityFeePerGas}
                  autoComplete="off"
                />
                <TextField
                  size="small"
                  label="maxPriorityFeePerGas"
                  type="number"
                  className={styles.gasOptionInput}
                  style={{ marginLeft: 12 }}
                  value={tmaxPriorityFeePerGas}
                  onChange={onChangeTMaxPriorityFeePerGas}
                  autoComplete="off"
                />
              </Box>

              <Box>
                <TextField
                  size="small"
                  label="gasLimit"
                  type="number"
                  className={styles.gasOptionInput}
                  value={gasLimit}
                  onChange={onChangeGasLimit}
                  autoComplete="off"
                />
                <TextField
                  size="small"
                  label="gasLimit"
                  type="number"
                  className={styles.gasOptionInput}
                  style={{ marginLeft: 12 }}
                  value={tgasLimit}
                  onChange={onChangeTGasLimit}
                  autoComplete="off"
                />
              </Box>

              <Typography mb={2}>Loaded files</Typography>
              <Box>
                {fileAndClients.map((f, i) => (
                  <Box key={i}>{f.fileName}</Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={8}>
              <Box>
                <TextField
                  size="small"
                  label="Enter IMX amount"
                  type="number"
                  className={styles.amountInput}
                  value={sellAmount}
                  onChange={onChangeSellAmount}
                  autoComplete="off"
                />

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

export default GetGemsV2Page;
