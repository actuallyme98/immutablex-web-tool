import React from 'react';

// providers
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';

// components
import Layout from './components/Layout';
import HomePage from './containers/home';
import RegisterOffChainPage from './containers/registerOffChain';
import TradingPage from './containers/trading';
import TradingV2Page from './containers/tradingv2';
import TradingV3Page from './containers/tradingv3';
import ExplorerPage from './containers/explorer';

// contexts
import { ExplorerContextProvider } from './containers/explorer/contexts';

// styles
import theme from './styles/theme';

// enums
import { AppRouteEnums } from './enums/route.enum';

const MainApp: React.FC = () => {
  const router = createBrowserRouter([
    {
      path: AppRouteEnums.HOME,
      element: <Layout />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: AppRouteEnums.REGISTER_OFF_CHAIN,
          element: <RegisterOffChainPage />,
        },
        {
          path: AppRouteEnums.TRADING,
          element: <TradingPage />,
        },
        {
          path: AppRouteEnums.TRADING,
          element: <TradingPage />,
        },
        {
          path: AppRouteEnums.TRADING_V2,
          element: <TradingV2Page />,
        },
        {
          path: AppRouteEnums.TRADING_V3,
          element: <TradingV3Page />,
        },
        {
          path: AppRouteEnums.EXPLORER,
          element: (
            <ExplorerContextProvider>
              <ExplorerPage />
            </ExplorerContextProvider>
          ),
        },
      ],
    },
  ]);

  return (
    <ThemeProvider theme={theme}>
      <StyledEngineProvider injectFirst>
        <CssBaseline />
        <RouterProvider router={router} />
      </StyledEngineProvider>
    </ThemeProvider>
  );
};

export default MainApp;
