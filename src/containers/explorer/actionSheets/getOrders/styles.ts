import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  label: {
    fontSize: 14,
  },
  assetItem: {
    display: 'inline-block',
    width: 150,
    height: 150,
    border: '1px solid #d1d1d1',
    borderRadius: 4,
    marginRight: 8,
  },
  assetImg: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  assetCollectionName: {
    fontSize: 13,
    maxWidth: 150,
    wordBreak: 'break-word',
    lineClamp: '2',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    '-webkit-box-orient': 'vertical',
  },
  assetName: {
    fontSize: 12,
    fontWeight: 700,
    maxWidth: 150,
    wordBreak: 'break-word',
    lineClamp: '2',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    '-webkit-box-orient': 'vertical',
  },
  assetId: {
    fontSize: 12,
    fontWeight: 600,
  },
});

export default useStyles;
