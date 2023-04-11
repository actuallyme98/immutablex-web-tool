import React, { useState, useContext } from 'react';

// components
import { ToastContainer, toast } from 'react-toastify';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import TextField from '../../../../components/TextField';
import SubmitButton from '../../../../components/SubmitButton';

// contexts
import { ExplorerContext } from '../../contexts';

// styles
import useStyles from './styles';

const GetOrderTab: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const styles = useStyles();

  const { connectedWallet } = useContext(ExplorerContext);

  const onChangeOrderId = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setOrderId(value);
  };

  const onSubmit = async () => {
    const orderIdTrimmed = orderId.trim();
    if (!orderIdTrimmed || !connectedWallet) return;
    try {
      setIsSubmitting(true);
      const { client } = connectedWallet;

      const response = await client.getOrder({
        id: orderIdTrimmed,
      });

      console.log('response', response);
    } catch (error: any) {
      toast(error.message, {
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <ToastContainer />
      <Typography mb={2}>Get Order</Typography>
      <Divider />
      <Grid container spacing={2} mt={0}>
        <Grid item xs={12}>
          <label className={styles.label}>Order Id</label>
          <TextField value={orderId} onChange={onChangeOrderId} />
        </Grid>

        <Grid item xs={12}>
          <SubmitButton
            disabled={isSubmitting || !orderId.trim() || !connectedWallet}
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

export default GetOrderTab;
