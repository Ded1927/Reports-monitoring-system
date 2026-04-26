import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ReportPage from './pages/ReportPage';

function App() {
  return (
    <BrowserRouter>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>
        <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              КіберЗахист. Кабінет Користувача
            </Typography>
            <Typography variant="body2">
              Організація: Тестова | test@cyber.gov.ua
            </Typography>
          </Toolbar>
        </AppBar>

        <Container component="main" maxWidth="md" sx={{ flex: 1, py: 4 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/report/:id" element={<ReportPage />} />
          </Routes>
        </Container>
      </Box>
    </BrowserRouter>
  );
}

export default App;
