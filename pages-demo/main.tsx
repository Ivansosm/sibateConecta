/// <reference types="vite/client" />
import React from 'react';
import { createRoot } from 'react-dom/client';
import Marketplace from '../app/marketplace';
import '../app/globals.css';
const basePath=import.meta.env.BASE_URL;
createRoot(document.getElementById('root')!).render(<Marketplace signedIn demoMode basePath={basePath}/>);
