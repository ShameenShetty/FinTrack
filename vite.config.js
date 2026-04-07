import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  },
  build: {
    rollupOptions: {
      input: {
        main:                './index.html',
        login:               './login.html',
        registration:        './registration.html',
        dashboard:           './dashboard.html',
        dashboardIndividual: './dashboard-individual.html',
        dashboardBusiness:   './dashboard-business.html',
        dashboardEnterprise: './dashboard-enterprise.html',
        addExpense:          './add-expense.html',
        addIncome:           './add-income.html',
        transaction:         './transactions.html',
      }
    }
  }
})