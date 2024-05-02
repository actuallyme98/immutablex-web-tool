import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

// components
import Box from '@mui/material/Box';
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
      label: 'Trading v2 (zkEVM)',
      path: AppRouteEnums.TRADING_V2,
    },
    {
      label: 'Trading v3 (ETH)',
      path: AppRouteEnums.TRADING_V3,
    },
    {
      label: 'Trading v4',
      path: AppRouteEnums.TRADING_V4,
    },
    {
      label: 'Explorer',
      path: AppRouteEnums.EXPLORER,
    },
    {
      label: 'Transfer',
      path: AppRouteEnums.TRANSFER,
    },
    {
      label: 'Claim Rewards',
      path: AppRouteEnums.CLAIM_REWARDS,
    },
    {
      label: 'Get Gems v1',
      path: AppRouteEnums.GET_GEMS_V1,
    },
    {
      label: 'Get Gems v2',
      path: AppRouteEnums.GET_GEMS_V2,
    },
    {
      label: 'Generate ETH accounts',
      path: AppRouteEnums.GENERATE_ETH_ACCOUNTS,
    },
  ];

  const renderMenuItems = useMemo(() => {
    return listMenuItems.map((item, index) => (
      <li key={index}>
        <Link to={item.path} className={styles.link}>
          {item.label}
        </Link>
      </li>
    ));
  }, [listMenuItems]);

  return (
    <Box className={styles.root}>
      <div>
        <Typography variant="h2" className={styles.heading}>
          ImmutableX Web Tools V2.22.0
        </Typography>

        <div>
          <ul>{renderMenuItems}</ul>
        </div>
      </div>
    </Box>
  );
};

export default HomePage;
