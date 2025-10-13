import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Chat from './pages/Chat'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import { isAuthenticated } from './utils/auth'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes - redirect to /chat if already logged in */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } 
        />
        
        {/* Protected route - requires authentication */}
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
        
        {/* Root route - redirect based on authentication status */}
        <Route 
          path="/" 
          element={
            isAuthenticated() 
              ? <Navigate to="/chat" replace /> 
              : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
