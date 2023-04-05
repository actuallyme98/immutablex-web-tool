import React from 'react';

import Button, { ButtonProps } from '@mui/material/Button/Button';
import CircularProgress from '@mui/material/CircularProgress';

import useStyles from './styles';

type Props = ButtonProps & {
  isLoading?: boolean;
};

const SubmitButton: React.FC<React.PropsWithChildren<Props>> = (props) => {
  const { isLoading, children, ...rest } = props;

  const styles = useStyles();

  return (
    <Button className={styles.root} {...rest} endIcon={isLoading ? null : rest.endIcon}>
      {isLoading ? <CircularProgress size={28} /> : children}
    </Button>
  );
};

export default SubmitButton;
