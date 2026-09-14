import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { I18nProvider } from './i18n/I18nContext.jsx'
import { ReservationProvider } from './store/ReservationContext.jsx'
import { SettingsProvider } from './store/SettingsContext.jsx'
import { RatesProvider } from './store/RatesContext.jsx'
import { EmailProvider } from './store/EmailContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <I18nProvider>
        <RatesProvider>
          <ReservationProvider>
            <SettingsProvider>
              <EmailProvider>
                <App />
              </EmailProvider>
            </SettingsProvider>
          </ReservationProvider>
        </RatesProvider>
      </I18nProvider>
    </HashRouter>
  </React.StrictMode>
)
