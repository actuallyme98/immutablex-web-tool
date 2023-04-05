import React, { useState } from 'react';

import { generateStarkPrivateKey, createStarkSigner } from '@imtbl/core-sdk';

// components
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Fingerprint from '@mui/icons-material/Fingerprint';
import Tooltip from '@mui/material/Tooltip';
import { ToastContainer, toast } from 'react-toastify';
import SubmitButton from '../../components/SubmitButton';

// hooks
import useCopyToClipboard from '../../hooks/useCopyToClipboard';

// services
import { getIMXElements } from '../../services/imx.service';

// utils
import * as starkPrivateKeyUtils from '../../utils/stark-private-key.util';

// styles
import useStyles from './styles';

const RegisterOffChainPage: React.FC = () => {
  const styles = useStyles();
  const [privateKey, setPrivateKey] = useState('');
  const [starkKey, setStarkKey] = useState('');
  const [openCopiedTooltip, setOpenCopiedTooltip] = useState(false);
  const [isGetStarkKeySubmitting, setIsGetStarkKeySubmitting] = useState(false);

  const [_, onCopy] = useCopyToClipboard();

  const onChangePrivateKey = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();

    setPrivateKey(value);
  };

  const onCopyStarkKey = () => {
    if (!starkKey) return;

    onCopy(starkKey);
    setOpenCopiedTooltip(true);

    setTimeout(() => {
      setOpenCopiedTooltip(false);
    }, 700);
  };

  const onGetStarkKey = async () => {
    try {
      setIsGetStarkKeySubmitting(true);
      setStarkKey('');

      const { client, ethSigner } = getIMXElements({
        walletPrivateKey: privateKey,
      });

      const address = await ethSigner.getAddress();

      const existData = starkPrivateKeyUtils.findOne(address);

      if (existData) {
        toast('User already registered', {
          type: 'warning',
        });

        setStarkKey(existData.starkPrivateKey);
        return;
      }

      const newStarkKey = generateStarkPrivateKey();
      const walletOption = {
        ethSigner,
        starkSigner: createStarkSigner(newStarkKey),
      };

      await client.registerOffchain(walletOption);

      starkPrivateKeyUtils.insertOne({
        address,
        starkPrivateKey: newStarkKey,
      });

      setStarkKey(newStarkKey);

      toast('Register success', {
        type: 'success',
      });
    } catch (error: any) {
      console.log(error);
      toast(error.message, {
        type: 'error',
      });
    } finally {
      setIsGetStarkKeySubmitting(false);
    }
  };

  return (
    <Box className={styles.root}>
      <div>
        <ToastContainer />

        <Typography variant="h2" className={styles.heading}>
          Register on L2
        </Typography>

        <div className={styles.inputContainer}>
          <TextField
            label="Your L1 wallet private key"
            fullWidth
            value={privateKey}
            onChange={onChangePrivateKey}
            autoComplete="off"
          />

          <div className={styles.registerBtnContainer}>
            <SubmitButton
              variant="contained"
              className={styles.registerBtn}
              fullWidth
              onClick={onGetStarkKey}
              isLoading={isGetStarkKeySubmitting}
              disabled={isGetStarkKeySubmitting || !privateKey}
              endIcon={<Fingerprint />}
            >
              Register
            </SubmitButton>
          </div>

          {starkKey && (
            <div className={styles.starkKeyContainer} onClick={onCopyStarkKey}>
              <Tooltip
                title="Copied"
                placement="right"
                arrow
                disableFocusListener
                disableHoverListener
                disableTouchListener
                open={openCopiedTooltip}
              >
                <Chip label={starkKey} color="success" className={styles.starkKeyChip} />
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </Box>
  );
};

export default RegisterOffChainPage;
