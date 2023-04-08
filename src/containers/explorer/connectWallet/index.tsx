import React, { useState } from 'react';

// components
import Box from '@mui/material/Box';

import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SubmitButton from '../../../components/SubmitButton';

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

  return (
    <Box className={styles.root}>
      <Typography mb={2}>Require connect to your wallet</Typography>
      <Box mb={2}>
        <TextField
          className={styles.inputContainer}
          value={walletPk}
          onChange={onChangeWalletPk}
          label="Wallet PK"
          size="small"
        />
      </Box>
      <Box mb={2}>
        <TextField
          className={styles.inputContainer}
          value={starkPk}
          onChange={onChangeStarkPk}
          label="Stark PK"
          size="small"
        />
      </Box>
      <Box>
        <SubmitButton disabled={!walletPk || !starkPk} onClick={onSubmit}>
          Connect
        </SubmitButton>
      </Box>
    </Box>
  );
};

export default ConnectWallet;
