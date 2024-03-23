import React, { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Select, MenuItem, SelectChangeEvent } from '@mui/material';

import { useSelector, useDispatch } from 'react-redux';
import { setSelectedNetwork } from '../../redux/actions/app.action';
import { sSelectedNetwork } from '../../redux/selectors/app.selector';
import { SelectedNetworkType } from '../../types/store/app';

import { SELECTED_NETWORK_OPTIONS } from '../../constants/system';
import { AppRouteEnums } from '../../enums/route.enum';

import useStyles from './styles';

type Props = {
  //
};

const Header: React.FC<Props> = () => {
  const selectedNetwork = useSelector(sSelectedNetwork);
  const styles = useStyles();
  const dispatch = useDispatch();

  const onChangeSelectedNetwork = useCallback((event: SelectChangeEvent) => {
    dispatch(setSelectedNetwork(event.target.value as SelectedNetworkType));
  }, []);

  const renderSelectedNetwork = useMemo(() => {
    return (
      <Select value={selectedNetwork} onChange={onChangeSelectedNetwork} size="small">
        {SELECTED_NETWORK_OPTIONS.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
      </Select>
    );
  }, [selectedNetwork]);

  return (
    <div className={styles.root}>
      <div>
        <Link className={styles.link} to={AppRouteEnums.HOME}>
          Home
        </Link>
      </div>
      <div>{renderSelectedNetwork}</div>
    </div>
  );
};

export default Header;
