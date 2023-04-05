import React from 'react';

// components
import Box from '@mui/material/Box';

// styles
import useStyles from './styles';

const TradingPage: React.FC = () => {
  const styles = useStyles();

  return <Box className={styles.root}></Box>;
};

export default TradingPage;
