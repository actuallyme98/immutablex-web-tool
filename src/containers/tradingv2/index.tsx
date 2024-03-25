import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import readXlsxFile from 'read-excel-file';
import * as ethers from 'ethers';

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
import { TradingService } from '../../types/local-storage';

// consts
import { IMX_ADDRESS } from '../../constants/imx';

// styles
import useStyles from './styles';

type CustomLog = {
  title: string;
  type?: 'error' | 'info' | 'warning' | 'success';
};

const TradingV2Page: React.FC = () => {
  const styles = useStyles();
  const [clients, setClients] = useState<TradingService[]>([]);
  const [logs, setLogs] = useState<CustomLog[]>([]);
  const [sellAmount, setSellAmount] = useState('');
  const [isTradeSubmitting, setIsTradeSubmitting] = useState(false);

  const selectedNetwork = useSelector(sSelectedNetwork);

  const onChangeSellAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSellAmount(value);
  };

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

  const etherToWei = (amount: string) => {
    return ethers.parseUnits(amount, 'ether').toString();
  };

  const onPreCreateOrders = async () => {
    const updatedClients: TradingService[] = [];

    pushLog({
      title: 'Start creating orders!',
      type: 'info',
    });

    for (const client of clients) {
      try {
        const { service, tokenAddress, tokenId } = client;

        const ethAddress = service.getAddress();

        pushLog({
          title: `Selected Address: ${ethAddress}`,
        });

        if (!tokenAddress || !tokenId) {
          pushLog({
            title: 'Skip this address because TokenAddress or TokenId are empty',
          });
          continue;
        }

        pushLog({
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

        pushLog({
          title: `Created order success with order id ${createdOrderResponse.order_id}`,
          type: 'success',
        });

        updatedClients.push({
          ...client,
          orderId: String(createdOrderResponse.order_id),
        });
      } catch (error: any) {
        pushLog({
          title: error.message,
          type: 'error',
        });
      }
    }

    return updatedClients;
  };

  const retryGetBalance = async (service: ImmutableService, retryCount = 10) => {
    let retryAttempts = 0;
    while (retryAttempts < retryCount) {
      try {
        const balanceResponse = await service.getBalance();
        return parseFloat(balanceResponse?.balance || '0');
      } catch (error) {
        retryAttempts++;
        pushLog({
          title: `Error fetching balance. Retry attempt ${retryAttempts} out of ${retryCount}`,
          type: 'warning',
        });
        if (retryAttempts >= retryCount) {
          pushLog({
            title: `Maximum retry attempts (${retryCount}) reached. Unable to fetch balance.`,
            type: 'error',
          });
          return 0;
        }
        await delay(2000); // Wait for 2 seconds
      }
    }

    return 0;
  };

  const triggerBuy = async (
    rootUser: TradingService,
    orderId: number | string,
    ownerClient: TradingService,
    retryCount = 20,
  ) => {
    const { service } = rootUser;
    const ethAddress = service.getAddress();

    pushLog({
      title: `An order ID ---${orderId}--- has been detected`,
    });

    pushLog({
      title: `Selected Address: ${ethAddress}`,
    });

    let currentBalance = await retryGetBalance(service, retryCount);
    const minRequiredBalance = parseFloat(sellAmount);

    pushLog({
      title: `${ethAddress} has balanceOf ${currentBalance} IMX`,
      type: 'info',
    });

    while (currentBalance < minRequiredBalance) {
      pushLog({
        title: 'Insufficient balance on account, waiting for 2s before retrying...',
        type: 'error',
      });
      await delay(2000); // Wait for 2 seconds
      currentBalance = await retryGetBalance(service, retryCount);
    }

    let retryAttempts = 0;
    while (retryAttempts < retryCount) {
      try {
        pushLog({
          title: 'Creating Trade ...',
        });

        await service.buy({
          request: {
            order_id: orderId as any,
            user: ethAddress,
          },
        });

        pushLog({
          title: `Trade success order ${orderId}`,
          type: 'success',
        });
        return;
      } catch (error: any) {
        pushLog({
          title: error.message,
          type: 'error',
        });

        if (error.message?.includes('not found')) {
          pushLog({
            title: 'Creating order again ...',
            type: 'warning',
          });

          await triggerLastTx(ownerClient, rootUser);
        } else {
          retryAttempts++;
          pushLog({
            title: `Retry attempt ${retryAttempts} out of ${retryCount}`,
            type: 'warning',
          });
          await delay(5000); // Wait for 5 seconds
        }
      }
    }

    pushLog({
      title: `Maximum retry attempts (${retryCount}) reached. Unable to complete trade.`,
      type: 'error',
    });
  };

  const triggerLastTx = async (rootClient: TradingService, rootWallet: TradingService) => {
    const { service, tokenAddress, tokenId, orderId } = rootClient;
    const ethAddress = service.getAddress();
    pushLog({
      title: `Selected Address: ${ethAddress}`,
    });
    if (!tokenAddress || !tokenId || !orderId) {
      pushLog({
        title: 'Skip this address because TokenAddress or TokenId or orderId are empty',
      });
      return;
    }

    await triggerBuy(rootWallet, orderId, rootClient);
  };

  const onStartTrade = async () => {
    if (clients.length === 0) return;

    const start = Date.now();

    setIsTradeSubmitting(true);

    try {
      pushLog({
        title: 'Start session ...',
      });
      const updatedClients = await onPreCreateOrders();

      const [rootClient, ...restClients] = updatedClients;

      let rootWallet: TradingService = rootClient;

      for (const selectedClient of restClients) {
        try {
          const { orderId } = selectedClient;

          if (!orderId) {
            pushLog({
              title: 'Skip this address because orderId is empty!',
            });
            continue;
          }

          await triggerBuy(rootWallet, orderId, selectedClient);
          rootWallet = selectedClient;
        } catch (error: any) {
          pushLog({
            title: error.message,
            type: 'error',
          });
          return;
        }
      }

      pushLog({
        title: 'Finished all addresses',
        type: 'success',
      });

      pushLog({
        title: 'Turn to execute first address',
      });

      await triggerLastTx(rootClient, rootWallet);
    } catch (error: any) {
      pushLog({
        title: error.message,
        type: 'error',
      });
    } finally {
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
          IMX web tools
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
                  disabled={isTradeSubmitting || !sellAmount || isNaN(parseFloat(sellAmount))}
                >
                  Start trade
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

export default TradingV2Page;
