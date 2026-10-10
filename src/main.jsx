import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './lib/auth.jsx'
import { CompetitionProvider } from './lib/competition.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <CompetitionProvider>
          <App />
        </CompetitionProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
)
