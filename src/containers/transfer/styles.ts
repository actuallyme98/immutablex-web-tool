import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  root: {
    padding: 64,
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
    textAlign: 'center',
  },
  leftMenuContainer: {
    border: '1px solid rgba(194, 224, 255, 0.08)',
    minHeight: 500,
    padding: 16,
    borderRadius: 8,
  },
  menuItem: {
    cursor: 'pointer',
    fontSize: 15,
    color: '#d1d1d1',
  },
  activeItem: {
    color: '#ffffff',
    fontWeight: 600,
  },
});

export default useStyles;
