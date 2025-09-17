import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/components/Login';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div className="flex h-screen">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <div className="p-8">
                      <Dashboard />
                    </div>
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;
