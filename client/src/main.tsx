import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BinServiceContext } from './contexts/binServiceContext.ts';
// import binService from './services/pgService.ts';
import binServiceLocal from './services/binServiceLocal.ts';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BinServiceContext value={binServiceLocal}>
      <App />
    </BinServiceContext>
  </StrictMode>,
);
