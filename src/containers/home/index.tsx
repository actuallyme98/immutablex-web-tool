import React, { useMemo } from 'react';

// components
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

// enums
import { AppRouteEnums } from '../../enums/route.enum';

// styles
import useStyles from './styles';

const HomePage: React.FC = () => {
  const styles = useStyles();

  const listMenuItems = [
    {
      label: 'Register Off Chain',
      path: AppRouteEnums.REGISTER_OFF_CHAIN,
    },
    {
      label: 'Trading',
      path: AppRouteEnums.TRADING,
    },
    {
      label: 'Explorer',
      path: AppRouteEnums.EXPLORER,
    },
  ];

  const renderMenuItems = useMemo(() => {
    return listMenuItems.map((item, index) => (
      <li key={index}>
        <Link href={item.path}>{item.label}</Link>
      </li>
    ));
  }, [listMenuItems]);

  return (
    <Box className={styles.root}>
      <div>
        <Typography variant="h2" className={styles.heading}>
          ImmutableX Web Tools V1.3
        </Typography>

        <div>
          <ul>{renderMenuItems}</ul>
        </div>
      </div>
    </Box>
  );
};

export default HomePage;
