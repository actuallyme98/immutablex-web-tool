import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  gasOptionInput: {
    marginBottom: 12,
    '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': {
      '-webkit-appearance': 'none',
      margin: 0,
    },
  },
});

export default useStyles;
