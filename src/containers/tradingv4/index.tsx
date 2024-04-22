import React, { useEffect, useMemo, useState, useCallback } from 'react';
import clsx from 'clsx';

import readXlsxFile from 'read-excel-file';
import { parseUnits } from 'ethers';
import moment from 'moment';

// components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import SubmitButton from '../../components/SubmitButton';

import { useSelector } from 'react-redux';
import { sSelectedNetwork } from '../../redux/selectors/app.selector';

// services
import { ImmutableService } from '../../services';

// utils
import { fromCsvToUsers } from '../../utils/format.util';
import { delay } from '../../utils/system';

// types
import { TradingService, TradingServiceV3 } from '../../types/local-storage';

// consts
import { IMX_ADDRESS } from '../../constants/imx';
import { DEFAULT_FORMAT_HOUR_AND_MINUTE } from '../../constants/system';

// styles
import useStyles from './styles';

type CustomLog = {
  title: string;
  type?: 'error' | 'info' | 'warning' | 'success';
};

type Logs = {
  fileName: string;
  logs: CustomLog[];
};

const TradingV4Page: React.FC = () => {
  const styles = useStyles();
  const [files, setFiles] = useState<File[]>([]);
  const [fileAndClients, setFileAndClients] = useState<TradingServiceV3[]>([]);
  const [logs, setLogs] = useState<Logs[]>([]);
  const [sellAmount, setSellAmount] = useState('');
  const [maxFeePerGas, setMaxFeePerGas] = useState('50');
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState('15');
  const [gasLimit, setGasLimit] = useState('300000');
  const [tradingTime, setTradingTime] = useState('');
  const [isTradeSubmitting, setIsTradeSubmitting] = useState(false);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);

  const selectedNetwork = useSelector(sSelectedNetwork);

  const onChangeSellAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSellAmount(value);
  };

  const onChangeTradingTimeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTradingTime(value);
  };

  const onResetTradingTime = () => {
    setTradingTime('');
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

  const onChangeFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const importedFiles = event.target.files || [];
    const newFiles = Array.from(importedFiles);
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  }, []);

  const onDeleteFile = useCallback((fileIndex: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== fileIndex));
  }, []);

  const pushLog = (fileName: string, item: CustomLog) => {
    setLogs((prevLogs) => {
      const existedLogIndex = prevLogs.findIndex((p) => p.fileName === fileName);
      if (existedLogIndex !== -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existedLogIndex] = {
          ...updatedLogs[existedLogIndex],
          logs: [...updatedLogs[existedLogIndex].logs, item],
        };
        return updatedLogs;
      } else {
        return [...prevLogs, { fileName, logs: [item] }];
      }
    });
  };

  const onClearLogs = () => {
    setLogs([]);
  };

  const etherToWei = (amount: string) => {
    return parseUnits(amount, 'ether').toString();
  };

  const onLoadWallets = async () => {
    setIsLoadingWallets(true);
    const updatedClients = await Promise.all(
      files.map(async (file) => {
        const rows = await readXlsxFile(file);
        const formattedUsers = fromCsvToUsers(rows);

        return {
          fileName: file.name,
          clients: formattedUsers.map((user, index) => {
            const service = new ImmutableService(
              selectedNetwork,
              user.privateKey,
              user.starkPrivateKey,
            );
            return {
              ...user,
              service,
              index: index + 1,
            };
          }),
        };
      }),
    );

    const updatedStateFileAndClient: TradingServiceV3[] = [];

    for (const client of updatedClients) {
      const fullFillClients = await onPreCreateOrders(client);

      updatedStateFileAndClient.push({
        fileName: client.fileName,
        clients: fullFillClients,
      });
    }

    setFileAndClients(updatedStateFileAndClient);
    setIsLoadingWallets(false);
  };

  const onPreCreateOrders = async (selectedClient: TradingServiceV3) => {
    const { fileName, clients } = selectedClient;
    const updatedClients: TradingService[] = [];

    pushLog(fileName, {
      title: `---------- ${fileName} is processing! ----------`,
    });

    for (const client of clients) {
      try {
        const { service, tokenAddress, tokenId } = client;

        const ethAddress = service.getAddress();

        pushLog(fileName, {
          title: `Selected Address: ${ethAddress}`,
        });

        if (!tokenAddress || !tokenId) {
          pushLog(fileName, {
            title: 'No tokenId found --> push updatedClients as empty!',
          });
          updatedClients.push({
            ...client,
            orderId: '',
          });
          continue;
        }

        pushLog(fileName, {
          title: 'Fetching orders...',
        });

        const getOrdersResponse = await service.getOrders(ethAddress);
        const listedOrders = getOrdersResponse.result || [];

        pushLog(fileName, {
          title: `Found ${listedOrders.length} orders!`,
        });

        if (listedOrders.length > 0) {
          for (const listedOrder of listedOrders) {
            const { order_id, id } = listedOrder as any;
            const orderId = order_id || id;
            pushLog(fileName, {
              title: `Cancelling order id: ${orderId}`,
            });
            await service.cancelOrder(orderId);
          }
        }

        pushLog(fileName, {
          title: `Creating Order ...`,
        });

        const createdOrderResponse = await service.sell({
          request: {
            buy: {
              amount: etherToWei(sellAmount),
              type: 'ERC20',
              tokenAddress: IMX_ADDRESS,
            },
            sell: {
              tokenAddress,
              tokenId,
              type: 'ERC721',
            },
          },
        });

        pushLog(fileName, {
          title: `Created order success with order id ${createdOrderResponse.order_id}`,
          type: 'success',
        });

        updatedClients.push({
          ...client,
          orderId: String(createdOrderResponse.order_id),
        });
      } catch (error: any) {
        pushLog(fileName, {
          title: error.message,
          type: 'error',
        });
        continue;
      }
    }

    return updatedClients;
  };

  const triggerBuy = async (
    rootUser: TradingService,
    orderId: number | string,
    retryCount = 50,
    fileName: string,
  ) => {
    const { service } = rootUser;
    const ethAddress = service.getAddress();

    pushLog(fileName, {
      title: `An order ID ---${orderId}--- has been detected`,
    });

    pushLog(fileName, {
      title: `Selected Address: ${ethAddress}`,
    });

    let retryAttempts = 0;

    const gasOptions = {
      maxPriorityFeePerGas: maxPriorityFeePerGas ? parseFloat(maxPriorityFeePerGas) * 1e9 : 25e9,
      maxFeePerGas: maxFeePerGas ? parseFloat(maxFeePerGas) * 1e9 : 75e9,
      gasLimit: gasLimit ? parseFloat(gasLimit) : 300000,
    };

    while (retryAttempts < retryCount) {
      try {
        await service.buy(
          {
            request: {
              order_id: orderId as any,
              user: ethAddress,
            },
          },
          gasOptions,
        );

        pushLog(fileName, {
          title: `Trade success order ${orderId}`,
          type: 'success',
        });
        return;
      } catch (error: any) {
        pushLog(fileName, {
          title: error.message,
          type: 'error',
        });

        retryAttempts++;
        pushLog(fileName, {
          title: `Retry attempt ${retryAttempts} out of ${retryCount}, waiting for 1s before retrying...`,
          type: 'warning',
        });

        await delay(1000);
      }
    }

    pushLog(fileName, {
      title: `Maximum retry attempts (${retryCount}) reached. Unable to complete trade.`,
      type: 'error',
    });
  };

  const triggerTransfer = async (
    service: ImmutableService,
    targetAddress: string,
    retryCount = 50,
    fileName: string,
  ) => {
    const ethAddress = service.getAddress();

    const minRequiredBalance = parseFloat(sellAmount);

    let retryAttempts = 0;

    pushLog(fileName, {
      title: `Starting transfer ${minRequiredBalance} IMX to ${ethAddress}`,
    });

    while (retryAttempts < retryCount) {
      try {
        await service.transfer({
          request: {
            type: 'ERC20',
            receiver: targetAddress,
            amount: etherToWei(sellAmount),
            tokenAddress: '',
          },
        });

        pushLog(fileName, {
          title: 'Transfer success!',
          type: 'success',
        });

        break;
      } catch (error: any) {
        retryAttempts++;

        pushLog(fileName, {
          title: `Transfer attempt ${retryAttempts} failed: ${error.message}`,
          type: 'error',
        });

        if (retryAttempts === retryCount) {
          pushLog(fileName, {
            title: `Maximum retry attempts reached (${retryCount}). Transfer failed.`,
            type: 'error',
          });

          throw new Error('Transfer failed after maximum retry attempts.');
        }

        await delay(1000);
      }
    }
  };

  const tradingv4 = async (fileAndClient: TradingServiceV3) => {
    const { fileName, clients } = fileAndClient;

    pushLog(fileName, {
      title: `---------- ${fileName} is processing! ----------`,
    });

    if (!clients.length) {
      pushLog(fileName, {
        title: `---- ${fileName} is empty! ----`,
        type: 'error',
      });
      return;
    }

    const [rootClient, ...restClients] = clients;
    const rootAddress = rootClient.service.getAddress();

    let rootWallet: TradingService = rootClient;
    let poolWallet: TradingService = rootClient;

    for (const selectedClient of restClients) {
      try {
        const { service, orderId, index } = selectedClient;
        const ethAddress = service.getAddress();
        pushLog(fileName, {
          title: `Selected Address: ${ethAddress}`,
        });

        if (index === undefined) {
          pushLog(fileName, {
            title: 'Skip this address because index is empty',
          });
          continue;
        }

        if (index % 2 === 0) {
          if (!orderId) {
            pushLog(fileName, {
              title: 'Skip this address because orderId is empty',
            });
            continue;
          }
          await triggerBuy(rootWallet, orderId, 50, fileName);
          poolWallet = selectedClient;
        } else {
          await triggerTransfer(poolWallet.service, ethAddress, 50, fileName);
          rootWallet = selectedClient;
        }
      } catch (error: any) {
        pushLog(fileName, {
          title: error.message,
          type: 'error',
        });
        return;
      }
    }

    pushLog(fileName, {
      title: 'Finished all addresses!',
      type: 'success',
    });

    await triggerTransfer(poolWallet.service, rootAddress, 50, fileName);
  };

  const onStartTrade = async () => {
    setIsTradeSubmitting(true);

    if (tradingTime) {
      const now = moment();
      const tradingMoment = moment(tradingTime, DEFAULT_FORMAT_HOUR_AND_MINUTE);

      const diffTime = moment(tradingMoment).diff(now);

      if (diffTime > 0) {
        await delay(diffTime);
      }
    }

    const start = Date.now();

    try {
      const promises: Promise<void>[] = [];

      for (const fileAndClient of fileAndClients) {
        promises.push(tradingv4(fileAndClient));
      }

      await Promise.allSettled(promises);
    } catch (error: any) {
      pushLog('[onStartTrade]', {
        title: error.message,
        type: 'error',
      });
    } finally {
      setIsTradeSubmitting(false);
      const end = Date.now();
      pushLog('[onStartTrade]', {
        title: `Execution time: ${end - start} ms`,
        type: 'success',
      });
    }
  };

  const renderFiles = useMemo(
    () =>
      files.map((file, index) => (
        <Alert key={index} onClose={() => onDeleteFile(index)}>
          {file.name}
        </Alert>
      )),
    [files],
  );

  const renderLogs = useMemo(() => {
    return logs.map((l, lid) => (
      <div key={lid}>
        {l.logs?.map((item, index) => (
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
        ))}
      </div>
    ));
  }, [logs]);

  useEffect(() => {
    setFileAndClients(
      fileAndClients.map((client) => ({
        ...client,
        clients: client.clients.map((c) => ({
          ...c,
          service: new ImmutableService(selectedNetwork, c.privateKey, c.starkPrivateKey),
        })),
      })),
    );
  }, [selectedNetwork]);

  return (
    <Box className={styles.root}>
      <Box width="100%">
        <Typography variant="h2" textAlign="center" mb={4}>
          Trading v4
        </Typography>

        <Box mb={4}>
          <input type="file" onChange={onChangeFile} accept=".csv, .xlsx" multiple />
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={4}>
            {files.length > 0 && (
              <Box mb={4}>
                <Box mb={2}>
                  <TextField
                    size="small"
                    label="Enter IMX amount"
                    type="number"
                    className={styles.amountInput}
                    value={sellAmount}
                    onChange={onChangeSellAmount}
                    autoComplete="off"
                  />
                  <Box mt={2} mb={1}>
                    Gas options:
                  </Box>
                  <TextField
                    size="small"
                    label="maxFeePerGas"
                    type="number"
                    className={styles.gasOptionInput}
                    value={maxFeePerGas}
                    onChange={onChangeMaxFeePerGas}
                    autoComplete="off"
                  />
                  <br />
                  <TextField
                    size="small"
                    label="maxPriorityFeePerGas"
                    type="number"
                    className={styles.gasOptionInput}
                    value={maxPriorityFeePerGas}
                    onChange={onChangeMaxPriorityFeePerGas}
                    autoComplete="off"
                  />
                  <br />
                  <TextField
                    size="small"
                    label="gasLimit"
                    type="number"
                    className={styles.gasOptionInput}
                    value={gasLimit}
                    onChange={onChangeGasLimit}
                    autoComplete="off"
                  />
                </Box>

                <SubmitButton
                  onClick={onLoadWallets}
                  disabled={!sellAmount}
                  isLoading={isLoadingWallets}
                >
                  Load wallets
                </SubmitButton>
              </Box>
            )}
            <Stack spacing={2}>{renderFiles}</Stack>
          </Grid>

          <Grid item xs={8}>
            <Box mb={2}>
              <input type="time" value={tradingTime} step={1} onChange={onChangeTradingTimeInput} />

              <SubmitButton
                style={{
                  marginLeft: 16,
                }}
                onClick={onResetTradingTime}
              >
                Reset Time
              </SubmitButton>
            </Box>

            <Box>
              <SubmitButton
                variant="contained"
                onClick={onStartTrade}
                isLoading={isTradeSubmitting}
                disabled={isTradeSubmitting || fileAndClients.length === 0}
              >
                Start trade
              </SubmitButton>

              <SubmitButton
                style={{
                  marginLeft: 16,
                }}
                onClick={onClearLogs}
              >
                Clear Logs
              </SubmitButton>
            </Box>

            <Box className={styles.logsContainer}>{renderLogs}</Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default TradingV4Page;
