import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { I18nProvider } from './i18n/I18nContext.jsx'
import { ReservationProvider } from './store/ReservationContext.jsx'
import { SettingsProvider } from './store/SettingsContext.jsx'
import { RatesProvider } from './store/RatesContext.jsx'
import { EmailProvider } from './store/EmailContext.jsx'
import { BookingProvider } from './store/BookingContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <RatesProvider>
          <ReservationProvider>
            <SettingsProvider>
              <EmailProvider>
                <BookingProvider>
                  <App />
                </BookingProvider>
              </EmailProvider>
            </SettingsProvider>
          </ReservationProvider>
        </RatesProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
)
