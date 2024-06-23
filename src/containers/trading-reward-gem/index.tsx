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
import { IMX_ADDRESS } from '../../constants/imx';

type CustomLog = {
  title: string;
  type?: 'error' | 'info' | 'warning' | 'success';
};

const delayTime = 180000;
const NOT_FOUND_NETWORK_ERROR_MESSAGE = 'could not detect network';

const TradingRewardGem: React.FC = () => {
  const styles = useStyles();
  const [fileAndClients, setFileAndClients] = useState<TradingServiceV3[]>([]);
  const [logs, setLogs] = useState<CustomLog[]>([]);
  const [isTradeSubmitting, setIsTradeSubmitting] = useState(false);

  const [rootPrivateKey, setRootPrivateKey] = useState('');
  const [contractAddress, setContractAddress] = useState(
    '0x0e95d13ee02b758a015dc72697b3284e3fc7bfd8',
  );
  const [tokenId, setTokenId] = useState('166988');
  const [transferAmount, setTransferAmount] = useState('2');
  const [tradeAmount, setTradeAmount] = useState('1.7');

  const onClearLogs = () => {
    setLogs([]);
  };

  const onChangeRootPrivateKey = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setRootPrivateKey(value);
  };

  const onChangeContractAdress = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setContractAddress(value);
  };

  const onChangeTokenId = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTokenId(value);
  };

  const onChangeTransferAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTransferAmount(value);
  };

  const onChangeAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTradeAmount(value);
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
    const minRequiredBalance = amount || transferAmount || '5';

    let retryAttempts = 0;

    const gasOptions = {
      maxPriorityFeePerGas: 10e9,
      maxFeePerGas: 15e9,
      gasLimit: 26000,
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

  const triggerBuy = async (
    rootUser: TradingService,
    orderId: number | string,
    retryCount = 10,
  ) => {
    const { service } = rootUser;
    const ethAddress = service.getAddress();

    pushLog({
      title: `An order ID ---${orderId}--- has been detected`,
    });

    pushLog({
      title: `Selected Address: ${ethAddress}`,
    });

    const balanceResponse = await service.getBalance();

    let currentBalance = parseFloat(balanceResponse?.balance || '0');

    const minRequiredBalance = parseFloat(tradeAmount);
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
        } else {
          retryAttempts++;
          pushLog({
            title: `Retry attempt ${retryAttempts} out of ${retryCount}`,
            type: 'warning',
          });
          await delay(10000);
        }
      }
    }

    pushLog({
      title: `Maximum retry attempts (${retryCount}) reached. Unable to complete trade.`,
      type: 'error',
    });
  };

  const onTrading = async (clients: TradingService[]) => {
    const rootWallet = clients[0];

    if (!rootPrivateKey) {
      pushLog({
        title: 'Enter root_private_key!',
        type: 'error',
      });
      return;
    }

    const minRequiredBalance = transferAmount || '1';

    const rootService = new ImmutableService('imxZkEVM', rootPrivateKey, '');
    const rootAddress = rootService.getAddress();
    let currentBalance = await retryGetBalance(rootWallet.service);
    pushLog({
      title: `Current balance is ${currentBalance}`,
      type: 'warning',
    });

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

    let nftService = rootService;

    for (const client of clients) {
      const { service } = client;
      const poolAddress = rootService.getAddress();
      const ethAddress = service.getAddress();

      if (rootAddress === ethAddress) {
        continue;
      }

      if (poolAddress !== ethAddress) {
        await triggerTransfer(rootService, ethAddress);
        await delay(1500); // delay 1s
      }

      pushLog({
        title: `Selected Address: ${ethAddress}`,
      });

      let retryCount = 15;
      while (retryCount > 0) {
        try {
          const createdOrderResponse = await nftService.sell({
            request: {
              buy: {
                amount: etherToWei(tradeAmount),
                type: 'ERC20',
                tokenAddress: IMX_ADDRESS,
              },
              sell: {
                tokenAddress: contractAddress,
                tokenId,
                type: 'ERC721',
              },
            },
          });

          pushLog({
            title: `Created order success with order id ${createdOrderResponse.order_id}`,
            type: 'success',
          });

          await triggerBuy(client, createdOrderResponse.order_id);
          const nftAddress = nftService.getAddress();
          if (nftAddress !== rootAddress) {
            await delay(4000);
            const { balance } = await nftService.getBalance();
            const remainingBalance = parseFloat(balance) - 0.02 - 0.00046;
            if (remainingBalance > 0.01) {
              await triggerTransfer(nftService, rootAddress, 15, remainingBalance.toFixed(4));
            }
          }
          nftService = service;
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
        title: `${ethAddress} get 30 Gem success!`,
        type: 'success',
      });
    }

    const nftAddress = nftService.getAddress();
    if (rootAddress !== nftAddress) {
      await nftService.transfer({
        request: {
          type: 'ERC721',
          receiver: rootAddress,
          tokenAddress: contractAddress,
          tokenId,
        },
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
        pushLog({
          title: `------------- Selected file ${fileAndClient.fileName} -------------`,
          type: 'warning',
        });
        await onTrading(fileAndClient.clients);

        pushLog({
          title: 'Delay 5s ....',
          type: 'warning',
        });
        await delay(5000);
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
          Get Trading reward gems
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
                  label="wallet_private_key"
                  className={styles.amountInput}
                  value={rootPrivateKey}
                  onChange={onChangeRootPrivateKey}
                  autoComplete="off"
                />

                <TextField
                  size="small"
                  label="Contract address"
                  className={styles.gasOptionInput}
                  value={contractAddress}
                  onChange={onChangeContractAdress}
                  autoComplete="off"
                />

                <TextField
                  size="small"
                  label="tokenId"
                  type="number"
                  className={styles.gasOptionInput}
                  value={tokenId}
                  onChange={onChangeTokenId}
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
                  label="Transfer amount"
                  className={styles.amountInput}
                  value={transferAmount}
                  onChange={onChangeTransferAmount}
                  autoComplete="off"
                />

                <TextField
                  size="small"
                  label="Trade amount"
                  className={styles.amountInput}
                  value={tradeAmount}
                  onChange={onChangeAmount}
                  autoComplete="off"
                />

                <SubmitButton
                  variant="contained"
                  onClick={onStartTrade}
                  isLoading={isTradeSubmitting}
                  disabled={isTradeSubmitting}
                >
                  Trade NFTs
                </SubmitButton>

                <SubmitButton style={{ marginLeft: 12 }} onClick={onClearLogs}>
                  Clear Logs
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

export default TradingRewardGem;
