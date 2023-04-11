import React, { useMemo } from 'react';

// components
import BuyTab from './buy';
import SellTab from './sell';
import TransferTab from './transfer';
import GetBalanceTab from './getBalance';
import ListAssetsTab from './listAssets';
import GetOrdersTab from './getOrders';

// styles
import useStyles from './styles';

export type SelectedTab = 'transfer' | 'getBalance' | 'listAssets' | 'buy' | 'sell' | 'getOrders';

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
      case 'getBalance':
        return <GetBalanceTab />;
      case 'getOrders':
        return <GetOrdersTab />;
      case 'listAssets':
      default:
        return <ListAssetsTab />;
    }
  }, [selectedTab]);

  return <div className={styles.root}>{renderTabs}</div>;
};

export default ActionSheets;
