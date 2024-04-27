import React from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

import useStyles from './styles';

type Props = {
  maxFeePerGas: string;
  onChangeMaxFeePerGas: (event: any) => void;
  maxPriorityFeePerGas: string;
  onChangeMaxPriorityFeePerGas: (event: any) => void;
  gasLimit: string;
  onChangeGasLimit: (event: any) => void;
};

const GasConfig: React.FC<Props> = (props) => {
  const {
    maxFeePerGas,
    onChangeMaxFeePerGas,
    gasLimit,
    maxPriorityFeePerGas,
    onChangeGasLimit,
    onChangeMaxPriorityFeePerGas,
  } = props;
  const styles = useStyles();

  return (
    <Box mb={2}>
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
  );
};

export default GasConfig;
