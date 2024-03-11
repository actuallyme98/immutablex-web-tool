import React, { useMemo, useContext, useState } from 'react';
import * as ethers from 'ethers';

// components
import { ToastContainer, toast } from 'react-toastify';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineSharpIcon from '@mui/icons-material/AddCircleOutlineSharp';
import ClearSharpIcon from '@mui/icons-material/ClearSharp';
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

const SellTab: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const styles = useStyles();

  const { selectedClient } = useContext(ExplorerContext);

  const etherToWei = (amount: string) => {
    return ethers.parseUnits(amount, 'ether').toString();
  };

  const onSubmit = async (values: FormValues) => {
    if (!selectedClient) return;

    try {
      const { service } = selectedClient;

      const response = await service.sell({
        request: {
          buy: {
            amount: etherToWei(values.amount),
            tokenAddress: IMX_ADDRESS,
            type: 'ERC20',
          },
          sell: {
            tokenAddress: values.collectionAddress,
            tokenId: values.tokenId,
            type: 'ERC721',
          },
          fees: values.fees.map((item) => ({
            address: item.address,
            fee_percentage: parseFloat(item.fee_percentage),
          })),
        },
      });

      setOrderId(response.order_id.toString());
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

  const { values, handleChange, handleSubmit, isValid, isSubmitting, dirty, setFieldValue } = form;

  const handleAddFeeRow = () => {
    setFieldValue(
      'fees',
      values.fees.concat({
        address: '',
        fee_percentage: '',
      }),
    );
  };

  const onRemoveFeeRow = (index: number) => {
    const newVal = values.fees.filter((_, id) => id !== index);

    setFieldValue('fees', newVal);
  };

  const renderFeeRows = useMemo(() => {
    return values.fees.map((row, index) => (
      <Box key={index} mb={2} className={styles.feeRowContainer}>
        <Box>
          <IconButton onClick={() => onRemoveFeeRow(index)}>
            <ClearSharpIcon />
          </IconButton>
        </Box>
        <Box width="100%" ml={4}>
          <Box>
            <label className={styles.label}>Address</label>
            <TextField
              name={`fees[${index}].address`}
              value={row.address}
              onChange={handleChange}
            />
          </Box>
          <Box>
            <label className={styles.label}>Fee Percentage</label>
            <TextField
              name={`fees[${index}.fee_percentage]`}
              value={row.fee_percentage}
              onChange={handleChange}
            />
          </Box>
        </Box>
      </Box>
    ));
  }, [values.fees]);

  return (
    <Box>
      <ToastContainer />
      <Typography mb={2}>Sell</Typography>
      <Divider />
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} mt={0}>
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

          <Grid item xs={12}>
            <label className={styles.label}>Amount</label>
            <TextField name="amount" value={values.amount} onChange={handleChange} />
          </Grid>

          <Grid item xs={12}>
            <label className={styles.label}>Fees (Optional)</label>
            <Box pl={2} mt={2}>
              {renderFeeRows}

              <Box>
                <IconButton onClick={handleAddFeeRow}>
                  <AddCircleOutlineSharpIcon color="primary" />
                </IconButton>
              </Box>
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

          {orderId && (
            <Grid item xs={12}>
              <Divider />
              <Box my={2}>
                <label className={styles.label}>Order Id (Output)</label>
                <TextField value={orderId} />
              </Box>
              <Divider />
            </Grid>
          )}
        </Grid>
      </form>
    </Box>
  );
};

export default SellTab;
