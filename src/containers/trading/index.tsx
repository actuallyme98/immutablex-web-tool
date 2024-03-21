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

const TradingPage: React.FC = () => {
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

  const weiToEther = (amount: string) => {
    return ethers.formatEther(amount);
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

  const triggerBuy = async (
    rootUser: TradingService,
    orderId: number | string,
    ownerClient: TradingService,
    retryCount = 10,
  ) => {
    const { service } = rootUser;
    const ethAddress = service.getAddress();

    pushLog({
      title: `Delected exist order id ${orderId}`,
    });

    pushLog({
      title: `Selected Address: ${ethAddress}`,
    });

    const balanceResponse = await service.getBalance();

    let currentBalance = parseFloat(balanceResponse?.balance || '0');

    const minRequiredBalance = parseFloat(sellAmount);
    pushLog({
      title: `${ethAddress} has balanceOf ${balanceResponse?.balance} IMX`,
      type: 'info',
    });

    while (currentBalance < minRequiredBalance) {
      pushLog({
        title: 'Insufficient balance on account, starting delay for 4s ...',
        type: 'error',
      });

      await delay(4000);

      const updatedBalanceResponse = await service.getBalance();

      currentBalance = parseFloat(updatedBalanceResponse?.balance || '0');
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
          await delay(7000);
        }
      }
    }

    pushLog({
      title: `Maximum retry attempts (${retryCount}) reached. Unable to complete trade.`,
      type: 'error',
    });
  };

  const triggerLastTx = async (rootClient: TradingService, rootWallet: TradingService) => {
    const { service, tokenAddress, tokenId } = rootClient;
    const ethAddress = service.getAddress();
    pushLog({
      title: `Selected Address: ${ethAddress}`,
    });
    if (!tokenAddress || !tokenId) {
      pushLog({
        title: 'Skip this address because TokenAddress or TokenId are empty',
      });
      return;
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
        // fees: [
        //   {
        //     address: ethAddress,
        //     fee_percentage: 100,
        //   },
        // ],
      },
    });

    pushLog({
      title: `Created order success with order id ${createdOrderResponse.order_id}`,
      type: 'success',
    });

    await triggerBuy(rootWallet, createdOrderResponse.order_id, rootClient);
  };

  const onStartTrade = async () => {
    const start = Date.now();
    if (clients.length === 0) return;

    // const savedSessionData = [...clients];
    const [rootClient, ...restClients] = clients;

    try {
      setIsTradeSubmitting(true);
      pushLog({
        title: 'Start session ...',
      });

      let rootWallet: TradingService = rootClient;

      for (const selectedClient of restClients) {
        try {
          const { service, tokenAddress, tokenId } = selectedClient;
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
              // fees: [
              //   {
              //     address: ethAddress,
              //     fee_percentage: 100,
              //   },
              // ],
            },
          });

          pushLog({
            title: `Created order success with order id ${createdOrderResponse.order_id}`,
            type: 'success',
          });

          await triggerBuy(rootWallet, createdOrderResponse.order_id, selectedClient);
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

export default TradingPage;
