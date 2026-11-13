import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import mockApiService from './services/mockApiService'
import { initializeStorage } from './lib/storage'

// Initialize offline storage and mock network interceptor for pure local demo mode
initializeStorage();
mockApiService.installMockFetchInterceptor();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
