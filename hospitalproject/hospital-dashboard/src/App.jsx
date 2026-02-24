import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import UserDashboard from './user-dashboard/UserDashboard';
import Overview from './pages/Overview';
import Analytics from './pages/Analytics';
import EmergencyRequests from './pages/EmergencyRequests';
import BedManagement from './pages/BedManagement';
import AmbulanceControl from './pages/AmbulanceControl';
import QueueManager from './pages/QueueManager';
import Appointments from './pages/Appointments';
import Settings from './pages/Settings';
import CallAmbulance from './pages/CallAmbulance';
import AuthContext from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const MainLayout = () => {
  const { user } = useContext(AuthContext);

  if (user?.role === 'user') {
    return <UserDashboard />;
  }

  return <DashboardLayout />;
};

import LandingPage from './pages/LandingPage';
import EmergencyPage from './user-dashboard/EmergencyPage';

const App = () => {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/sos" element={<EmergencyPage />} />
        <Route path="/" element={
          user ? (
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          ) : (
            <LandingPage />
          )
        }>
          <Route index element={<Overview />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="emergency" element={<EmergencyRequests />} />
          <Route path="beds" element={<BedManagement />} />
          <Route path="ambulances" element={<AmbulanceControl />} />
          <Route path="queue" element={<QueueManager />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="settings" element={<Settings />} />
          <Route path="call-ambulance" element={<CallAmbulance />} />
        </Route>
      </Routes>
    </BrowserRouter >
  );
};

export default App;
