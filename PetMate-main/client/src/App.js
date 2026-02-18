import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, RequireGuest, RequireAdmin } from './components/RouteGuards';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyOTP from './pages/VerifyOTP';
import Dashboard from './pages/Dashboard';
import AddPet from './pages/AddPet';
import PetProfile from './pages/PetProfile';
import Search from './pages/Search';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Careers from './pages/Careers';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={
                  <RequireGuest>
                    <Login />
                  </RequireGuest>
                } />
                <Route path="/register" element={
                  <RequireGuest>
                    <Register />
                  </RequireGuest>
                } />
                <Route path="/forgot-password" element={
                  <RequireGuest>
                    <ForgotPassword />
                  </RequireGuest>
                } />
                <Route path="/reset-password" element={
                  <RequireGuest>
                    <ResetPassword />
                  </RequireGuest>
                } />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/dashboard" element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                } />
                <Route path="/add-pet" element={
                  <RequireAuth>
                    <AddPet />
                  </RequireAuth>
                } />
                <Route path="/pet/:id" element={<PetProfile />} />
                <Route path="/search" element={<Search />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/matches" element={
                  <RequireAuth>
                    <Matches />
                  </RequireAuth>
                } />
              <Route path="/profile" element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              } />
              <Route path="/admin" element={
                <RequireAdmin>
                  <AdminPanel />
                </RequireAdmin>
              } />
                <Route path="/chat/:chatId" element={
                  <RequireAuth>
                    <Chat />
                  </RequireAuth>
                } />
              </Routes>
            </main>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
              containerStyle={{
                top: 80,
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

