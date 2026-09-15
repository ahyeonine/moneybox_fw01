import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { I18nProvider } from './i18n/I18nContext.jsx'
import { ReservationProvider } from './store/ReservationContext.jsx'
import { RatesProvider } from './store/RatesContext.jsx'
import { EmailProvider } from './store/EmailContext.jsx'
import { PolicyProvider } from './store/PolicyContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <I18nProvider>
        <PolicyProvider>
          <RatesProvider>
            <ReservationProvider>
              <EmailProvider>
                <App />
              </EmailProvider>
            </ReservationProvider>
          </RatesProvider>
        </PolicyProvider>
      </I18nProvider>
    </HashRouter>
  </React.StrictMode>
)
