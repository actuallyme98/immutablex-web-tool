import React, { useState } from 'react';
import { AssetWithOrders } from '@imtbl/core-sdk';

// components
import { ToastContainer, toast } from 'react-toastify';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import TextField from '../../../../../components/TextField';
import SubmitButton from '../../../../../components/SubmitButton';

// styles
import useStyles from './styles';

type Props = {
  open: boolean;
  asset: AssetWithOrders;
  onClose: () => void;
  onSubmit: (address: string) => Promise<void>;
};

const TransferNFTDialog: React.FC<Props> = (props) => {
  const { open, onClose, asset, onSubmit } = props;
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const styles = useStyles();

  const onChangeAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setAddress(value);
  };

  const onSubmitTransferNFT = async () => {
    if (!address) return;
    try {
      setIsSubmitting(true);
      await onSubmit(address);
    } catch (_) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <Box className={styles.content}>
        <Box>
          <div>{asset.name}</div>
          <div>#{asset.token_id}</div>
        </Box>

        <Box mt={2}>
          <label className={styles.label}>Receiver</label>
          <TextField value={address} onChange={onChangeAddress} />
        </Box>

        <Box mt={2}>
          <SubmitButton fullWidth onClick={onSubmitTransferNFT} isLoading={isSubmitting}>
            Submit
          </SubmitButton>
        </Box>
      </Box>
    </Dialog>
  );
};

export default TransferNFTDialog;
