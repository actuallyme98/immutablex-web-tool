import Axios from 'axios';

const axios = Axios.create({
  baseURL: 'https://api.sandbox.x.immutable.com',
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
});

export default axios;
