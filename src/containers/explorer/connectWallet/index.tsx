import React, { useState, useContext } from 'react';

import readXlsxFile from 'read-excel-file';

// components
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SubmitButton from '../../../components/SubmitButton';

// services
import { getIMXElements } from '../../../services/imx.service';

// contexts
import { ExplorerContext } from '../contexts';

// utils
import { fromCsvToUsers } from '../../../utils/format.util';
import { randomString } from '../../../utils/string';

// types
import { ConnectedWallet } from '../../../types/local-storage';

// styles
import useStyles from './styles';

type Props = {
  onConnectWallet: (walletPk: string, starkPk: string) => void;
};

const ConnectWallet: React.FC<Props> = (props) => {
  const { onConnectWallet } = props;
  const [walletPk, setWalletPk] = useState('');
  const [starkPk, setStarkPk] = useState('');
  const styles = useStyles();

  const { onSetClients, onSetSelectedClient } = useContext(ExplorerContext);

  const onChangeWalletPk = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setWalletPk(value);
  };
  const onChangeStarkPk = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setStarkPk(value);
  };

  const onSubmit = () => {
    if (!walletPk || !starkPk) return;
    onConnectWallet(walletPk, starkPk);
  };

  const onChangeFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const rows = await readXlsxFile(file);

    const formattedUsers = fromCsvToUsers(rows);

    try {
      const clients: ConnectedWallet[] = [];

      formattedUsers.forEach((user) => {
        const elements = getIMXElements({
          walletPrivateKey: user.privateKey,
        });

        clients.push({
          ...elements,
          starkPrivateKey: user.starkPrivateKey,
          walletName: user.walletName,
          id: randomString(),
        });
      });

      onSetClients(clients);
      onSetSelectedClient(clients[0]);
    } catch (error) {
      //
    }

    event.target.value = '';
  };

  return (
    <Box className={styles.root}>
      <Box>
        <Typography mb={2}>Require connect to your wallet</Typography>
        <Box mb={2}>
          <TextField
            className={styles.inputContainer}
            value={walletPk}
            onChange={onChangeWalletPk}
            label="Wallet PK"
            size="small"
            autoComplete="off"
          />
        </Box>
        <Box mb={2}>
          <TextField
            className={styles.inputContainer}
            value={starkPk}
            onChange={onChangeStarkPk}
            label="Stark PK"
            size="small"
            autoComplete="off"
          />
        </Box>
        <Box>
          <SubmitButton disabled={!walletPk || !starkPk} onClick={onSubmit}>
            Connect
          </SubmitButton>
        </Box>
      </Box>

      <Box ml={4}>
        <div>Connect bulks</div>
        <input type="file" onChange={onChangeFile} accept=".csv, .xlsx" />
      </Box>
    </Box>
  );
};

export default ConnectWallet;
