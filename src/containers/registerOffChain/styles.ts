import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  root: {
    textAlign: 'center',
    padding: 64,
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
  },
  registerBtnContainer: {
    marginTop: 16,
  },
  registerBtn: {
    textTransform: 'unset',
    fontSize: 16,
  },
  inputContainer: {
    marginTop: 32,
  },
  starkKeyContainer: {
    marginTop: 32,
    textAlign: 'left',
  },
  starkKeyChip: {
    cursor: 'pointer',
    borderRadius: 6,
  },
});

export default useStyles;
