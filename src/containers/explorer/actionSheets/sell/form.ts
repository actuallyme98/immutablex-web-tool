import * as Yup from 'yup';

type FeeRow = {
  address: string;
  fee_percentage: string;
};

export type FormValues = {
  type: 'ETH' | 'IMX';
  collectionAddress: string;
  tokenId: string;
  amount: string;
  fees: FeeRow[];
};

export const initialValues: FormValues = {
  type: 'IMX',
  collectionAddress: '',
  tokenId: '',
  amount: '',
  fees: [],
};

export const validationSchema = Yup.object().shape({
  collectionAddress: Yup.string().required(),
  tokenId: Yup.string().required(),
  amount: Yup.string().required(),
});
