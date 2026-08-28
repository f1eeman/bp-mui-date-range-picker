import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// The layer-order declaration has to be registered before the package's own
// stylesheet: a layer name takes its position the first time it is seen, so
// loading the package first would pin `bp-drp` outside the host's order.
import './styles.css';
import '../src/styles.css';
// The host's own stylesheet: unlayered, so it outranks the package layer.
import './skins.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
