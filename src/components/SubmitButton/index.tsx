import React from 'react';

import Button, { ButtonProps } from '@mui/material/Button/Button';
import CircularProgress from '@mui/material/CircularProgress';

type Props = ButtonProps & {
  isLoading?: boolean;
};

const SubmitButton: React.FC<React.PropsWithChildren<Props>> = (props) => {
  const { isLoading, children, ...rest } = props;

  return (
    <Button {...rest} endIcon={isLoading ? null : rest.endIcon}>
      {isLoading ? <CircularProgress size={28} /> : children}
    </Button>
  );
};

export default SubmitButton;
