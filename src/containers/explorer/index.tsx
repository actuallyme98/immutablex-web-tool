import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

// components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import ActionSheets, { SelectedTab } from './actionSheets';

// styles
import useStyles from './styles';

type MenuItem = {
  label: string;
  value: SelectedTab;
};

const ExplorerPage: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<SelectedTab>('transfer');

  const menus: MenuItem[] = [
    {
      label: 'transfer',
      value: 'transfer',
    },
    {
      label: 'getBalance',
      value: 'getBalance',
    },
    {
      label: 'listAssets',
      value: 'listAssets',
    },
  ];

  const renderLeftMenus = useMemo(() => {
    return menus.map((item, index) => (
      <div
        className={clsx(styles.menuItem, {
          [styles.activeItem]: item.value === selectedTab,
        })}
        onClick={() => setSelectedTab(item.value)}
        key={index}
      >
        {item.label}
      </div>
    ));
  }, [menus, selectedTab]);

  return (
    <Box className={styles.root}>
      <div>
        <Typography variant="h2" className={styles.heading}>
          Explorer
        </Typography>

        <Grid container spacing={4} mt={8}>
          <Grid item xs={4}>
            <div className={styles.leftMenuContainer}>{renderLeftMenus}</div>
          </Grid>

          <Grid item xs={8}>
            <ActionSheets selectedTab={selectedTab} />
          </Grid>
        </Grid>
      </div>
    </Box>
  );
};

export default ExplorerPage;
