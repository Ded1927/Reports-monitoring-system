import { AppBar, Toolbar, Typography, Container, Box, Button, CircularProgress, Tabs, Tab } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Dashboard from './pages/Dashboard';
import Assessments from './pages/Assessments';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Archive from './pages/Archive';
import ReportPage from './pages/ReportPage';
import LoginPage from './pages/LoginPage';

import AnalystHome from './pages/analyst/AnalystHome';
import AnalystAnalytics from './pages/analyst/AnalystAnalytics';
import AnalystRegistry from './pages/analyst/AnalystRegistry';
import AnalystOrganizations from './pages/analyst/AnalystOrganizations';
import AnalystRecommendations from './pages/analyst/AnalystRecommendations';

import LogoutIcon from '@mui/icons-material/Logout';

const USER_TABS = [
  { label: 'Головна', path: '/' },
  { label: 'Оцінювання', path: '/assessments' },
  { label: 'Сповіщення', path: '/notifications' },
  { label: 'Профіль', path: '/profile' },
];

const ANALYST_TABS = [
  { label: 'Головна', path: '/' },
  { label: 'Дашборд', path: '/analytics' },
  { label: 'Реєстр звітів', path: '/registry' },
  { label: 'Організації', path: '/organizations' },
  // { label: 'Рекомендації', path: '/recommendations' }, // вимкнено
  { label: 'Сповіщення', path: '/notifications' },
  { label: 'Профіль', path: '/profile' },
];

function ProtectedRoutes() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress /></Box>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAnalyst = user.role === 'ANALYST' || user.role === 'FUNC_ADMIN' || user.role === 'SYS_ADMIN';
  const tabs = isAnalyst ? ANALYST_TABS : USER_TABS;
  const currentTab = tabs.some(t => t.path === location.pathname) ? location.pathname : false;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>
      <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: '-0.5px' }}>
            КіберЗахист. {isAnalyst ? 'Кабінет Аналітика' : 'Кабінет Користувача'}
          </Typography>
          <Typography variant="body2" sx={{ mr: 3, opacity: 0.85 }}>
            {user.first_name} {user.last_name} | {user.email}
          </Typography>
          <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />} sx={{ fontWeight: 600 }}>
            Вийти
          </Button>
        </Toolbar>
        <Box sx={{ px: 3, bgcolor: 'primary.dark' }}>
          <Tabs
            value={currentTab}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ minHeight: 46 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map(tab => (
              <Tab
                key={tab.path}
                label={tab.label}
                value={tab.path}
                component={Link}
                to={tab.path}
                sx={{ minHeight: 46, fontWeight: 600, fontSize: '0.875rem', textTransform: 'none', opacity: 0.85, '&.Mui-selected': { opacity: 1 } }}
              />
            ))}
          </Tabs>
        </Box>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Routes>
          {isAnalyst ? (
            <>
              <Route path="/" element={<AnalystHome />} />
              <Route path="/analytics" element={<AnalystAnalytics />} />
              <Route path="/registry" element={<AnalystRegistry />} />
              <Route path="/organizations" element={<AnalystOrganizations />} />
              {/* <Route path="/recommendations" element={<AnalystRecommendations />} /> */}
            </>
          ) : (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assessments" element={<Assessments />} />
              <Route path="/archive" element={<Archive />} />
            </>
          )}
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/report/:id" element={<ReportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
