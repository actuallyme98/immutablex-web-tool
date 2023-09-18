import React, { useMemo } from 'react';

// components
import BuyTab from './buy';
import SellTab from './sell';
import TransferTab from './transfer';
import TransferToMainWalletTab from './transferToMainWallet';
import TransferToSubWalletsTab from './transferToSubWallet';
import GetBalanceTab from './getBalance';
import ListAssetsTab from './listAssets';
import GetOrdersTab from './getOrders';
import TransferNFTMultipleTab from './transferNFTmultiple';

// styles
import useStyles from './styles';

export type SelectedTab =
  | 'transfer'
  | 'transfer-nft-multiple'
  | 'transfer-to-main-wallet'
  | 'transfer-to-sub-wallets'
  | 'getBalance'
  | 'listAssets'
  | 'buy'
  | 'sell'
  | 'getOrders';

type Props = {
  selectedTab: SelectedTab;
};

const ActionSheets: React.FC<Props> = (props) => {
  const { selectedTab } = props;
  const styles = useStyles();

  const renderTabs = useMemo(() => {
    switch (selectedTab) {
      case 'buy':
        return <BuyTab />;
      case 'sell':
        return <SellTab />;
      case 'transfer':
        return <TransferTab />;
      case 'transfer-to-main-wallet':
        return <TransferToMainWalletTab />;
      case 'transfer-to-sub-wallets':
        return <TransferToSubWalletsTab />;
      case 'getBalance':
        return <GetBalanceTab />;
      case 'getOrders':
        return <GetOrdersTab />;
      case 'transfer-nft-multiple':
        return <TransferNFTMultipleTab />;
      case 'listAssets':
      default:
        return <ListAssetsTab />;
    }
  }, [selectedTab]);

  return <div className={styles.root}>{renderTabs}</div>;
};

export default ActionSheets;
