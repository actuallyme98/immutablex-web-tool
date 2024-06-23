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

const CheckWalletPage: React.FC = () => {
  const styles = useStyles();
  const [fileAndClients, setFileAndClients] = useState<TradingServiceV3[]>([]);
  const [logs, setLogs] = useState<CustomLog[]>([]);
  const [isTradeSubmitting, setIsTradeSubmitting] = useState(false);
  // const [rootPrivateKey, setRootPrivateKey] = useState('');

  // const onChangeRootPrivateKey = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = event.target.value;
  //   setRootPrivateKey(value);
  // };

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
    retryCount = 15,
    amount?: string,
  ) => {
    const minRequiredBalance = amount || '0.01';

    let retryAttempts = 0;

    pushLog({
      title: `Starting transfer ${minRequiredBalance} IMX to ${targetAddress}`,
    });

    const gasOptions = {
      maxPriorityFeePerGas: 10e9,
      maxFeePerGas: 15e9,
      gasLimit: 26000,
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

  const onCheckWallet = async (clients: TradingService[]) => {
    // if (!rootPrivateKey) {
    //   pushLog({
    //     title: 'Enter ROOT_PRIVATE_KEY!',
    //     type: 'error',
    //   });
    //   return;
    // }

    const rootService = new ImmutableService(
      'imxZkEVM',
      'fadbfeda5aec6fe24da3797bd5963fed2766d01c382b85c5d5f42eee0fc186d1',
      '',
    );
    const rootAddress = rootService.getAddress();
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

      const remainingBalance = parseFloat(totalBalance) - 0.02 - 0.00046;
      if (
        remainingBalance > 0.01 &&
        ethAddress.toLocaleLowerCase() !== rootAddress.toLocaleLowerCase()
      ) {
        await triggerTransfer(service, rootAddress, 15, remainingBalance.toFixed(4));
      } else if (parseFloat(totalBalance) < 0.01) {
        await triggerTransfer(rootService, ethAddress, 15, '0.01');
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
              {/* <TextField
                size="small"
                label="Enter ROOT_PRIVATE_KEY"
                className={styles.amountInput}
                value={rootPrivateKey}
                onChange={onChangeRootPrivateKey}
                autoComplete="off"
              /> */}

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
