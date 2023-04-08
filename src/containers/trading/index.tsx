import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

import { createStarkSigner } from '@imtbl/core-sdk';
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

// services
import { getIMXElements } from '../../services/imx.service';

// utils
import { fromCsvToUsers } from '../../utils/format.util';
import { delay } from '../../utils/system';

// types
import { TradingClient } from '../../types/local-storage';

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
  const [clients, setClients] = useState<TradingClient[]>([]);
  const [logs, setLogs] = useState<CustomLog[]>([]);
  const [sellAmount, setSellAmount] = useState('');
  const [isTradeSubmitting, setIsTradeSubmitting] = useState(false);

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
        const elements = getIMXElements({
          walletPrivateKey: user.privateKey,
        });

        setClients((prev) =>
          prev.concat({
            ...elements,
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

  const triggerBuy = async (rootUser: TradingClient, orderId: number, ownerAddress: string) => {
    const { client, ethSigner, starkPrivateKey } = rootUser;
    const starkSigner = createStarkSigner(starkPrivateKey);
    const ethAddress = await ethSigner.getAddress();

    pushLog({
      title: `Delected exist order ${orderId}`,
    });

    pushLog({
      title: `Selected Address: ${ethAddress}`,
    });

    // const balanceResponse = await client.getBalance({
    //   address: IMX_ADDRESS,
    //   owner: ethAddress,
    // });

    // let currentBalance = parseInt(balanceResponse?.balance || '0');
    // const minRequiredBalance = parseFloat(sellAmount) * 1e18 * 3;

    // while (currentBalance < minRequiredBalance) {
    //   pushLog({
    //     title: 'Insufficient balance on account, starting deplay for 15s ...',
    //     type: 'error',
    //   });

    //   await delay(15000);

    //   const updatedBalanceResponse = await client.getBalance({
    //     address: IMX_ADDRESS,
    //     owner: ethAddress,
    //   });

    //   currentBalance = parseInt(updatedBalanceResponse?.balance || '0');
    // }

    pushLog({
      title: 'Creating Trade ...',
    });

    await client.createTrade(
      {
        ethSigner,
        starkSigner,
      },
      {
        order_id: orderId,
        user: ownerAddress,
        // fees: [
        //   {
        //     address: ownerAddress,
        //     fee_percentage: 100,
        //   },
        // ],
      },
    );

    pushLog({
      title: `Trade success order ${orderId}`,
      type: 'success',
    });
  };

  const triggerLastTx = async (rootClient: TradingClient, rootWallet: TradingClient) => {
    const { client, ethSigner, starkPrivateKey, tokenAddress, tokenId } = rootClient;
    const starkSigner = createStarkSigner(starkPrivateKey);
    const ethAddress = await ethSigner.getAddress();
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
    const createdOrderResponse = await client.createOrder(
      {
        ethSigner,
        starkSigner,
      },
      {
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
    );

    pushLog({
      title: `Created order success with order id ${createdOrderResponse.order_id}`,
      type: 'success',
    });

    await triggerBuy(rootWallet, createdOrderResponse.order_id, ethAddress);
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

      let rootWallet: TradingClient = rootClient;

      for (const selectedClient of restClients) {
        try {
          const { client, ethSigner, starkPrivateKey, tokenAddress, tokenId } = selectedClient;
          const starkSigner = createStarkSigner(starkPrivateKey);
          const ethAddress = await ethSigner.getAddress();
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
          const createdOrderResponse = await client.createOrder(
            {
              ethSigner,
              starkSigner,
            },
            {
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
          );

          pushLog({
            title: `Created order success with order id ${createdOrderResponse.order_id}`,
            type: 'success',
          });

          await triggerBuy(rootWallet, createdOrderResponse.order_id, ethAddress);
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
    return clients.map((item, index) => <Alert key={index}>{item.wallet.address}</Alert>);
  }, [clients]);

  const renderLogs = useMemo(() => {
    return logs.map((item, index) => (
      <code
        key={index}
        className={clsx(styles.logLine, {
          [styles.logLineError]: item.type === 'error',
          [styles.logLineSuccess]: item.type === 'success',
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
