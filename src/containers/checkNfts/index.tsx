import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import readXlsxFile from 'read-excel-file';
import { CSVLink } from 'react-csv';

// components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import SubmitButton from '../../components/SubmitButton';

// services
import { ImmutableService } from '../../services';

import { useSelector } from 'react-redux';
import { sSelectedNetwork } from '../../redux/selectors/app.selector';

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

type IData = {
  privateKey: string;
  starkPrivateKey: string;
  tokenAddress?: string;
  tokenId?: string;
};

const CheckNFTsPage: React.FC = () => {
  const styles = useStyles();
  const [fileAndClients, setFileAndClients] = useState<TradingServiceV3[]>([]);
  const [logs, setLogs] = useState<CustomLog[]>([]);
  const [datas, setDatas] = useState<IData[]>([]);
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

  const onCheckWallet = async (clients: TradingService[]) => {
    for (const client of clients) {
      const { service, privateKey, starkPrivateKey } = client;
      const ethAddress = service.getAddress();

      pushLog({
        title: `Selected Address: ${ethAddress}`,
      });

      const nfts: any[] = [];

      let retryCount = 10;

      while (retryCount > 0) {
        try {
          let cursor = undefined;

          do {
            const response = await service.getAssets(undefined, 200, cursor);
            nfts.push(...response.result);
            cursor = selectedNetwork === 'imxZkEVM' ? response.page.next_cursor : response.cursor;
          } while (cursor);

          break; // Exit the loop if successful
        } catch (error: any) {
          pushLog({
            title: error.message,
            type: 'error',
          });

          await delay(1000); // delay 1s

          retryCount--;
          if (retryCount === 0) {
            throw new Error(`Failed to checkNFTs after 10 retries for ${ethAddress}`);
          }
        }
      }

      pushLog({
        title: `${ethAddress} has list nfts: `,
      });

      if (nfts.length === 0) {
        pushLog({
          title: 'Null',
        });
      } else {
        nfts.forEach((nft) => {
          pushLog({
            title: `NFT: ${nft.name} - ${nft.token_id}`,
          });

          setDatas((prev) =>
            prev.concat({
              privateKey,
              starkPrivateKey,
              tokenAddress: nft.contract_address,
              tokenId: nft.token_id,
            }),
          );
        });
      }

      pushLog({
        title: '------------------------------------------------------',
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
          Check NFTs
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
              <Box className={styles.actionContainer}>
                <SubmitButton
                  variant="contained"
                  onClick={onStartTrade}
                  isLoading={isTradeSubmitting}
                  disabled={isTradeSubmitting}
                >
                  Check
                </SubmitButton>

                {datas.length > 0 && !isTradeSubmitting && (
                  <Box>
                    <CSVLink
                      data={datas}
                      headers={[
                        {
                          label: 'wallet_private_key',
                          key: 'privateKey',
                        },
                        {
                          label: 'stark_private_key',
                          key: 'starkPrivateKey',
                        },
                        {
                          label: 'collection_address',
                          key: 'tokenAddress',
                        },
                        {
                          label: 'token_id',
                          key: 'tokenId',
                        },
                      ]}
                    >
                      Download files
                    </CSVLink>
                  </Box>
                )}
              </Box>

              <Box className={styles.logsContainer}>{renderLogs}</Box>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default CheckNFTsPage;
