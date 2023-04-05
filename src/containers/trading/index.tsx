import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

import { CreateOrderResponse, createStarkSigner } from '@imtbl/core-sdk';

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
import { formatArrayOfKeys, toUsers, etherToWei } from '../../utils/format.util';

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

    const reader = new FileReader();
    reader.onload = function () {
      const formattedLines = formatArrayOfKeys(reader.result?.toString(), '\n');

      const formattedUsers = toUsers(formattedLines);

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
    };
    reader.readAsText(file);

    event.target.value = '';
  };

  const pushLog = (item: CustomLog) => {
    setLogs((prev) => prev.concat(item));
  };

  const onStartTrade = async () => {
    if (clients.length === 0) return;

    // const savedSessionData = [...clients];

    try {
      setIsTradeSubmitting(true);
      pushLog({
        title: 'Start session ....',
      });

      let existedOrderResponse: CreateOrderResponse | undefined = undefined;
      let existedUser: string | undefined = undefined;

      for (const selectedClient of clients) {
        try {
          const { client, ethSigner, starkPrivateKey, tokenAddress, tokenId } = selectedClient;

          const starkSigner = createStarkSigner(starkPrivateKey);
          const ethAddress = await ethSigner.getAddress();

          pushLog({
            title: `Selected Address: ${ethAddress}`,
          });

          const balance = await client.getBalance({
            owner: ethAddress,
            address: IMX_ADDRESS,
          });

          pushLog({
            title: `Balance: ${balance.balance}`,
          });

          if (existedOrderResponse && existedUser) {
            const orderId = existedOrderResponse.order_id;
            pushLog({
              title: `Delected exist order ${orderId}`,
            });

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
                user: existedUser,
              },
            );

            pushLog({
              title: `Trade success order ${orderId}`,
            });

            const updatedBalance = await client.getBalance({
              owner: ethAddress,
              address: IMX_ADDRESS,
            });

            pushLog({
              title: `Updated balance: ${updatedBalance.balance}`,
            });
          }

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
            },
          );

          existedOrderResponse = createdOrderResponse;
          existedUser = ethAddress;

          pushLog({
            title: `Created order success with order id ${createdOrderResponse.order_id}`,
          });
        } catch (error: any) {
          pushLog({
            title: error.message,
            type: 'error',
          });
          return;
        }
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
            <input type="file" onChange={onChangeFile} accept=".txt" />
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
