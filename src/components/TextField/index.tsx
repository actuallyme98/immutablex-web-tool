import React from 'react';
import clsx from 'clsx';

// components
import TextField, { TextFieldProps } from '@mui/material/TextField';

// styles
import useStyles from './styles';

type Props = TextFieldProps;

const CustomTextField: React.FC<Props> = (props) => {
  const styles = useStyles();

  return <TextField size="small" fullWidth autoComplete="off" {...props} />;
};

export default CustomTextField;
