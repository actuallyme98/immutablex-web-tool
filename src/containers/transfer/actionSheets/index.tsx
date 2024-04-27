import React, { useMemo } from 'react';

// components
import TransferToMainWalletTab from './transferToMainWallet';
import TransferToSubWalletsTab from './transferToSubWallet';
import TransferNFTMultipleTab from './transferNFTmultiple';

// styles
import useStyles from './styles';

import { GasOptions } from '../../../types/local-storage';

export type SelectedTab =
  | 'transfer-nft-multiple'
  | 'transfer-to-main-wallet'
  | 'transfer-to-sub-wallets';

type Props = {
  selectedTab: SelectedTab;
  gasOptions: GasOptions;
};

const ActionSheets: React.FC<Props> = (props) => {
  const { selectedTab, gasOptions } = props;
  const styles = useStyles();

  const renderTabs = useMemo(() => {
    switch (selectedTab) {
      case 'transfer-to-main-wallet':
        return <TransferToMainWalletTab gasOptions={gasOptions} />;
      case 'transfer-to-sub-wallets':
        return <TransferToSubWalletsTab gasOptions={gasOptions} />;
      case 'transfer-nft-multiple':
        return <TransferNFTMultipleTab gasOptions={gasOptions} />;
      default:
        return <TransferToMainWalletTab gasOptions={gasOptions} />;
    }
  }, [selectedTab, gasOptions]);

  return <div className={styles.root}>{renderTabs}</div>;
};

export default ActionSheets;
