import React, { useContext } from 'react';
import { UnsignedTransferRequest } from '@imtbl/core-sdk';
import * as ethers from 'ethers';

// components
import { ToastContainer, toast } from 'react-toastify';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
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

import { toShortAddress } from '../../../../utils/string';

// styles
import useStyles from './styles';

const TransferTab: React.FC = () => {
  const styles = useStyles();

  const { selectedClient, clients } = useContext(ExplorerContext);

  const etherToWei = (amount: string) => {
    return ethers.parseUnits(amount, 'ether').toString();
  };

  const onSubmit = async (values: FormValues) => {
    if (!selectedClient) return;

    try {
      const { service } = selectedClient;

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

      const gasOptions = {
        maxPriorityFeePerGas: 10e9,
        maxFeePerGas: 15e9,
        gasLimit: 26000,
      };

      await service.transfer({ request }, gasOptions);

      toast('Transfer success!', {
        type: 'success',
      });
    } catch (error: any) {
      toast(error?.response?.data?.message || error.message, {
        type: 'error',
      });
    }
  };

  const form = useFormik({
    initialValues: initialValues,
    onSubmit,
    validationSchema,
  });

  const { values, handleChange, handleSubmit, setFieldValue, isValid, isSubmitting, dirty } = form;

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
                  setFieldValue('receiver', option.address);
                }}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') {
                    return option;
                  }
                  return option.walletName || option.address;
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="receiver"
                    value={values.receiver}
                    onChange={handleChange}
                  />
                )}
                size="small"
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <SubmitButton
              disabled={!isValid || !dirty || isSubmitting || !selectedClient}
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
