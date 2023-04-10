import React, { useContext, useMemo, useState } from 'react';
import { AssetWithOrders } from '@imtbl/core-sdk';

// components
import { ToastContainer, toast } from 'react-toastify';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import SubmitButton from '../../../../components/SubmitButton';
import TextField from '../../../../components/TextField';

// contexts
import { ExplorerContext } from '../../contexts';

// styles
import useStyles from './styles';

const ListAssetsTab: React.FC = () => {
  const [address, setAddress] = useState('');
  const [assets, setAssets] = useState<AssetWithOrders[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const styles = useStyles();

  const { connectedWallet } = useContext(ExplorerContext);

  const onSubmit = async () => {
    if (!connectedWallet) return;

    try {
      setIsSubmitting(true);
      const { client, wallet } = connectedWallet;
      const ethAddress = await wallet.getAddress();

      const response = await client.listAssets({
        user: address.trim() || ethAddress,
      });

      setAssets(response.result);
    } catch (error: any) {
      toast(error.message, {
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onChangeAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setAddress(value);
  };

  const renderAssets = useMemo(() => {
    return assets.map((item, index) => (
      <Box key={index} className={styles.assetItem}>
        <Box>
          <img className={styles.assetImg} src={item.image_url || ''} alt="" />
        </Box>

        <Box>
          <div className={styles.assetCollectionName}>{item.collection.name}</div>
          <div className={styles.assetName}>{item.name}</div>
          <div className={styles.assetId}>#{item.token_id}</div>
        </Box>
      </Box>
    ));
  }, [assets]);

  return (
    <Box>
      <ToastContainer />
      <Typography mb={2}>List Assets</Typography>
      <Divider />
      <Grid container spacing={2} mt={0}>
        <Grid item xs={12}>
          <label className={styles.label}>
            Owner <span className={styles.labelNote}>(optional)</span>
          </label>
          <TextField value={address} onChange={onChangeAddress} />
        </Grid>

        <Grid item xs={12}>
          <SubmitButton
            onClick={onSubmit}
            disabled={isSubmitting || !connectedWallet}
            isLoading={isSubmitting}
          >
            Submit
          </SubmitButton>
        </Grid>

        <Grid item xs={12}>
          <Box className={styles.assetContainer}>{renderAssets}</Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ListAssetsTab;
