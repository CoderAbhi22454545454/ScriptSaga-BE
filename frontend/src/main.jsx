import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store, { persistor } from './redux/store.js'
import './index.css'
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { PersistGate } from 'redux-persist/integration/react'
import { TooltipProvider } from './components/ui/tooltip.jsx'
import { Toaster } from './components/ui/sonner.jsx'

// Create a client
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
    <Toaster />
  </React.StrictMode>,
)
