import React, { useState, useContext } from 'react';

// components
import { ToastContainer, toast } from 'react-toastify';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import TextField from '../../../../components/TextField';
import SubmitButton from '../../../../components/SubmitButton';

import { useSelector } from 'react-redux';
import { sSelectedNetwork } from '../../../../redux/selectors/app.selector';

// contexts
import { ExplorerContext } from '../../contexts';

// styles
import useStyles from './styles';

const BuyTab: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedNetwork = useSelector(sSelectedNetwork);
  const styles = useStyles();

  const { selectedClient } = useContext(ExplorerContext);

  const onChangeOrderId = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setOrderId(value);
  };

  const onSubmit = async () => {
    const orderIdTrimmed = orderId.trim();
    if (!orderIdTrimmed || !selectedClient) return;
    try {
      setIsSubmitting(true);
      const { service } = selectedClient;

      const order_id: any =
        selectedNetwork === 'ethereum' ? parseInt(orderIdTrimmed) : orderIdTrimmed;

      await service.buy({
        request: {
          order_id,
        },
      });

      toast('Trade success!', {
        type: 'success',
      });
    } catch (error: any) {
      toast(error?.response?.data?.message || error.message, {
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <ToastContainer />
      <Typography mb={2}>Buy</Typography>
      <Divider />
      <Grid container spacing={2} mt={0}>
        <Grid item xs={12}>
          <label className={styles.label}>Order Id</label>
          <TextField value={orderId} onChange={onChangeOrderId} />
        </Grid>

        <Grid item xs={12}>
          <SubmitButton
            disabled={isSubmitting || !orderId.trim() || !selectedClient}
            isLoading={isSubmitting}
            onClick={onSubmit}
          >
            Submit
          </SubmitButton>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BuyTab;
