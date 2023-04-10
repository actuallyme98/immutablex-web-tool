import * as Yup from 'yup';

export type FormValues = {
  type: 'ERC721' | 'ETH' | 'ERC20';
  tokenId: string;
  collectionAddress: string;
  receiver: string;
  amount?: string;
};

export const initialValues: FormValues = {
  type: 'ERC721',
  collectionAddress: '',
  receiver: '',
  tokenId: '',
  amount: '',
};

export const validationSchema = Yup.object().shape({
  collectionAddress: Yup.string().required(),
  tokenId: Yup.string().required(),
  type: Yup.string().required(),
  receiver: Yup.string().required(),
  amount: Yup.string().test('check-type', 'Required', function (value) {
    if (this.parent.type === 'ERC721') return true;

    return !!value;
  }),
});
