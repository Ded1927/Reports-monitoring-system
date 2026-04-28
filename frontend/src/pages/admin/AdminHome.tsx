import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const mockAuditLog = [
  { id: 1, action: 'Створено користувача', target: 'analyst2@cyber.gov.ua', time: '28.04.2026 09:15' },
  { id: 2, action: 'Змінено роль', target: 'user3@test.ua → ANALYST', time: '28.04.2026 08:40' },
  { id: 3, action: 'Видалено організацію', target: 'Тестова Org', time: '27.04.2026 17:20' },
  { id: 4, action: 'Додано організацію', target: 'МОЗ України', time: '27.04.2026 14:05' },
];

export default function AdminHome() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Користувачів', value: stats.total_users, icon: <PeopleIcon sx={{ fontSize: 36 }} />, color: '#1976d2' },
    { label: 'Організацій', value: stats.total_orgs, icon: <BusinessIcon sx={{ fontSize: 36 }} />, color: '#2e7d32' },
    { label: 'Активних акаунтів', value: stats.new_users, icon: <PersonAddIcon sx={{ fontSize: 36 }} />, color: '#ed6c02' },
    { label: 'Поданих звітів', value: stats.total_reports, icon: <AdminPanelSettingsIcon sx={{ fontSize: 36 }} />, color: '#7b1fa2' },
  ] : [];

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 4 }}>Головна</Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4 }}>
            {cards.map(c => (
              <Paper key={c.label} sx={{ p: 3, borderRadius: 3, textAlign: 'center', borderTop: `4px solid ${c.color}` }}>
                <Box sx={{ color: c.color, mb: 1 }}>{c.icon}</Box>
                <Typography variant="h2" sx={{ color: c.color, fontWeight: 800, fontSize: '2.5rem' }}>{c.value}</Typography>
                <Typography variant="body2" color="text.secondary">{c.label}</Typography>
              </Paper>
            ))}
          </Box>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h3" sx={{ mb: 3 }}>Останні адміністративні дії</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {mockAuditLog.map(entry => (
                <Box key={entry.id} sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: '#f9f9f9', borderRadius: 2, gap: 2 }}>
                  <AdminPanelSettingsIcon sx={{ color: 'text.secondary', fontSize: 20, flexShrink: 0 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight="bold">{entry.action}</Typography>
                    <Typography variant="caption" color="text.secondary">{entry.target}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{entry.time}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
