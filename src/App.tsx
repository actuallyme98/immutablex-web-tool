import React from 'react';

// providers
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';

// components
import HomePage from './containers/home';
import RegisterOffChainPage from './containers/registerOffChain';
import TradingPage from './containers/trading';

// styles
import theme from './styles/theme';

// enums
import { AppRouteEnums } from './enums/route.enum';

const MainApp: React.FC = () => {
  const router = createBrowserRouter([
    {
      path: AppRouteEnums.HOME,
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
