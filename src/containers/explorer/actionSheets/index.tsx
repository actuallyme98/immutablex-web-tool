import React, { useMemo } from 'react';

// components
import TransferTab from './transfer';

// styles
import useStyles from './styles';

export type SelectedTab = 'transfer' | 'getBalance' | 'listAssets';

type Props = {
  selectedTab: SelectedTab;
};

const ActionSheets: React.FC<Props> = (props) => {
  const { selectedTab } = props;
  const styles = useStyles();

  const renderTabs = useMemo(() => {
    switch (selectedTab) {
      case 'transfer':
      case 'getBalance':
      case 'listAssets':
      default:
    }
  }, [selectedTab]);

  return <div className={styles.root}></div>;
};

export default ActionSheets;
