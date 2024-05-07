import React, { useState, useMemo } from 'react';

import { CSVLink } from 'react-csv';
import * as web3 from 'web3-eth-accounts';

import TextField from '@mui/material/TextField';

import useStyles from './styles';

const GenerateEthAccounts = () => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<web3.Web3Account[]>([]);
  const [quantity, setQuantity] = useState('150');

  const styles = useStyles();

  const onChangeQuantity = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuantity(value);
  };

  const onCreateAccount = async () => {
    setLoading(true);
    const accoutnQty = parseInt(quantity || '100');
    for (let i = 0; i < accoutnQty; i++) {
      const data = web3.create();
      setAccounts((prev) => prev.concat(data));
    }
    setLoading(false);
  };

  const datas = useMemo(() => {
    return accounts.map((account) => ({
      wallet_private_key: account.privateKey,
      address: account.address,
    }));
  }, [accounts]);

  return (
    <div className={styles.root}>
      <div>
        <TextField
          label="Account Quantity"
          size="small"
          value={quantity}
          onChange={onChangeQuantity}
        />

        <br />
        <br />
        <br />

        <CSVLink
          data={datas}
          headers={[
            {
              label: 'wallet_private_key',
              key: 'wallet_private_key',
            },
            {
              label: 'address',
              key: 'address',
            },
          ]}
        >
          Download files
        </CSVLink>

        <br />
        <br />
        <br />

        <button onClick={onCreateAccount} disabled={loading}>
          {loading ? 'Creating accounts ...' : 'Create Accounts'}
        </button>

        <br />
        <br />
        <br />

        <div>----------Created Accounts----------</div>

        {accounts.map((account, index) => (
          <div key={index}>
            <div>Address: {account.address}</div>
            <div>Private Key: {account.privateKey}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GenerateEthAccounts;
