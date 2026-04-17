import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

// Protected wrapper for the Insurer Command Center
const ProtectedAdminRoute = ({ children }) => {
  const isAdmin = useAuthStore((state) => state.isAdmin);
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Onboarding />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
}


function App() {
  return (
    <BrowserRouter>
      <main className="min-h-screen bg-background text-on-surface">
        <AnimatedRoutes />
      </main>
    </BrowserRouter>
  );
}

export default App;
