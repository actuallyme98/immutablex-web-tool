import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    justifyContent: 'center',
    padding: 64,
  },
  logsContainer: {
    border: '1px solid rgba(194, 224, 255, 0.08)',
    height: 500,
    marginTop: 24,
    padding: 8,
    overflowY: 'auto',
  },
  logLine: {
    fontSize: 14,
    display: 'block',
  },
  logLineSuccess: {
    color: '#00e676',
  },
  logLineError: {
    color: '#f44336',
  },
  logLineWarning: {
    color: '#ffeb3b',
  },
  amountInput: {
    marginRight: 16,
    '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': {
      '-webkit-appearance': 'none',
      margin: 0,
    },
  },
  gasOptionInput: {
    marginBottom: 12,
    marginRight: 12,
    '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': {
      '-webkit-appearance': 'none',
      margin: 0,
    },
  },
});

export default useStyles;
