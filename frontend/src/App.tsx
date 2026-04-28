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
        {/* Рядок 1: назва системи */}
        <Toolbar sx={{ minHeight: '56px !important', py: 0.5 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, letterSpacing: '-0.3px', fontSize: '1.5rem' }}>
            ІС Моніторингу стану кіберзахисту
          </Typography>
        </Toolbar>

        {/* Рядок 2: вкладки + тип кабінету + ім'я + вийти */}
        <Box sx={{ px: 3, bgcolor: 'primary.dark', display: 'flex', alignItems: 'center' }}>
          {/* Тип кабінету зліва — займає рівно 1/3 */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ opacity: 0.7, whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.7rem', color: 'inherit' }}>
              {isAnalyst ? 'Кабінет аналітика' : 'Кабінет користувача'}
            </Typography>
          </Box>

          {/* Вкладки по центру */}
          <Tabs
            value={currentTab}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ minHeight: 46 }}
            variant="scrollable"
            scrollButtons="auto"
            centered
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

          {/* Ім'я + вийти справа — займає рівно 1/3, вирівняно вправо */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
            <Typography variant="body2" sx={{ opacity: 0.85, whiteSpace: 'nowrap' }}>
              {user.first_name} {user.last_name}
            </Typography>
            <Button
              color="inherit"
              onClick={logout}
              startIcon={<LogoutIcon sx={{ fontSize: '1rem !important' }} />}
              size="small"
              sx={{ fontWeight: 600, textTransform: 'none', opacity: 0.85, '&:hover': { opacity: 1 }, minHeight: 46 }}
            >
              Вийти
            </Button>
          </Box>
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
