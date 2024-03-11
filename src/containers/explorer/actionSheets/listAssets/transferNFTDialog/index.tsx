import React, { useState, useContext } from 'react';
import { AssetWithOrders } from '@imtbl/core-sdk';

// components
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '../../../../../components/TextField';
import SubmitButton from '../../../../../components/SubmitButton';

// contexts
import { ExplorerContext } from '../../../contexts';

// utils
import { toShortAddress } from '../../../../../utils/string';

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

  const { clients } = useContext(ExplorerContext);

  const onChangeAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    console.log('value', value);
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
          <Autocomplete
            freeSolo
            options={clients.map((client) => {
              const ethAddress = client.service.getAddress();

              return {
                id: client.id,
                address: ethAddress,
                walletName: `${client.walletName} (${toShortAddress(ethAddress)})`,
              };
            })}
            onChange={(_, option) => {
              if (typeof option === 'string' || !option) {
                return;
              }
              setAddress(option.address);
            }}
            getOptionLabel={(option) => {
              if (typeof option === 'string') {
                return option;
              }
              return option.walletName || option.address;
            }}
            renderInput={(params) => (
              <TextField {...params} value={address} onChange={onChangeAddress} />
            )}
            size="small"
          />
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
