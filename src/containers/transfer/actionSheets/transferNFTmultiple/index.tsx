import React, { useState, useMemo } from 'react';
import clsx from 'clsx';

import readXlsxFile from 'read-excel-file';

// comonents
import { ToastContainer } from 'react-toastify';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import SubmitButton from '../../../../components/SubmitButton';

import { useSelector } from 'react-redux';
import { sSelectedNetwork } from '../../../../redux/selectors/app.selector';

// services
import { ImmutableService } from '../../../../services';

// utils
import { fromCsvToUsers } from '../../../../utils/format.util';

// types
import { TradingService, GasOptions } from '../../../../types/local-storage';

// styles
import useStyles from './styles';

type CustomLog = {
  title: string;
  type?: 'error' | 'info' | 'warning' | 'success';
};

type Props = {
  gasOptions: GasOptions;
};

const TransferNFTMultipleTab: React.FC<Props> = (props) => {
  const { gasOptions } = props;
  const [clients, setClients] = useState<TradingService[]>([]);
  const [logs, setLogs] = useState<CustomLog[]>([]);
  const [isTradeSubmitting, setIsTradeSubmitting] = useState(false);

  const selectedNetwork = useSelector(sSelectedNetwork);

  const styles = useStyles();

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
  };

  const pushLog = (item: CustomLog) => {
    setLogs((prev) => prev.concat(item));
  };

  const onSubmitTransfer = async () => {
    try {
      if (clients.length === 0) return;

      for (const selectedClient of clients) {
        try {
          const { service, targetWallet, tokenAddress, tokenId } = selectedClient;
          const ethAddress = service.getAddress();

          if (!targetWallet || !tokenId || !tokenAddress) {
            pushLog({
              title: `Missing collection_address or token_id or target_wallet`,
              type: 'error',
            });
            continue;
          }

          pushLog({
            title: `Select address: ${ethAddress}`,
          });

          pushLog({
            title: `Starting transfer ${tokenId} in collection address ${tokenAddress} to ${targetWallet}`,
          });

          await service.transfer(
            {
              request: {
                type: 'ERC721',
                receiver: targetWallet,
                tokenAddress,
                tokenId,
              },
            },
            gasOptions,
          );

          pushLog({
            title: 'Transfer success!',
            type: 'success',
          });
        } catch (error: any) {
          pushLog({
            title: error.message,
            type: 'error',
          });
          pushLog({
            title: `Skip current client`,
            type: 'warning',
          });
          continue;
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
    <Box>
      <ToastContainer />
      <Typography mb={2}>Transfer Multiple</Typography>
      <Divider />
      <Grid container spacing={2} mt={0}>
        <Grid item xs={12}>
          <input type="file" onChange={onChangeFile} accept=".csv, .xlsx" />
        </Grid>

        <Grid item xs={12}>
          <SubmitButton
            onClick={onSubmitTransfer}
            disabled={clients.length === 0 || isTradeSubmitting}
            isLoading={isTradeSubmitting}
          >
            Submit
          </SubmitButton>
        </Grid>

        {logs.length > 0 && (
          <Grid item xs={12}>
            <Box className={styles.logsContainer}>{renderLogs}</Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default TransferNFTMultipleTab;
