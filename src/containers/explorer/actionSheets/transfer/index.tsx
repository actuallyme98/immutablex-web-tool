import React, { useContext } from 'react';
import { createStarkSigner, WalletConnection, UnsignedTransferRequest } from '@imtbl/core-sdk';
import * as ethers from 'ethers';

// components
import { ToastContainer, toast } from 'react-toastify';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import SubmitButton from '../../../../components/SubmitButton';
import TextField from '../../../../components/TextField';

// contexts
import { ExplorerContext } from '../../contexts';

// form
import { useFormik } from 'formik';
import { FormValues, initialValues, validationSchema } from './form';

// consts
import { IMX_ADDRESS } from '../../../../constants/imx';

// styles
import useStyles from './styles';

const TransferTab: React.FC = () => {
  const styles = useStyles();

  const { connectedWallet } = useContext(ExplorerContext);

  const etherToWei = (amount: string) => {
    return ethers.parseUnits(amount, 'ether').toString();
  };

  const onSubmit = async (values: FormValues) => {
    if (!connectedWallet) return;

    try {
      const { client, ethSigner, starkPk } = connectedWallet;
      const walletConnection: WalletConnection = {
        ethSigner,
        starkSigner: createStarkSigner(starkPk),
      };

      let request: UnsignedTransferRequest = {
        type: 'ERC721',
        receiver: values.receiver,
        tokenAddress: values.collectionAddress,
        tokenId: values.tokenId,
      };

      if (values.type === 'ERC20') {
        if (!values.amount) return;
        request = {
          type: 'ERC20',
          amount: etherToWei(values.amount),
          receiver: values.receiver,
          tokenAddress: IMX_ADDRESS,
        };
      }

      if (values.type === 'ETH') {
        if (!values.amount) return;
        request = {
          type: 'ETH',
          amount: etherToWei(values.amount),
          receiver: values.receiver,
        };
      }

      const response = await client.transfer(walletConnection, request);

      toast('Transfer success!', {
        type: 'success',
      });
    } catch (error: any) {
      toast(error.message, {
        type: 'error',
      });
    }
  };

  const form = useFormik({
    initialValues: initialValues,
    onSubmit,
    validationSchema,
  });

  const { values, handleChange, handleSubmit, isValid, isSubmitting, dirty } = form;

  return (
    <Box>
      <ToastContainer />
      <Typography mb={2}>Transfer</Typography>
      <Divider />
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={12}>
            <Select name="type" size="small" value={values.type} onChange={handleChange}>
              <MenuItem value="ERC721">ERC721</MenuItem>
              <MenuItem value="ERC20">IMX</MenuItem>
              <MenuItem value="ETH">ETH</MenuItem>
            </Select>
          </Grid>

          {values.type === 'ERC721' ? (
            <>
              <Grid item xs={12}>
                <label className={styles.label}>Collection Address</label>
                <TextField
                  name="collectionAddress"
                  value={values.collectionAddress}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <label className={styles.label}>Token Id</label>
                <TextField name="tokenId" value={values.tokenId} onChange={handleChange} />
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <label className={styles.label}>Amount</label>
              <TextField name="amount" value={values.amount} onChange={handleChange} />
            </Grid>
          )}

          <Grid item xs={12}>
            <label className={styles.label}>Receiver</label>
            <TextField name="receiver" value={values.receiver} onChange={handleChange} />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <SubmitButton
              disabled={!isValid || !dirty || isSubmitting || !connectedWallet}
              isLoading={isSubmitting}
              type="submit"
            >
              Submit
            </SubmitButton>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default TransferTab;
