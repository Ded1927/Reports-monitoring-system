import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Divider, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import UpdateIcon from '@mui/icons-material/Update';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import InboxIcon from '@mui/icons-material/Inbox';

const iconForIndex = (i: number, role: string) => {
  if (role === 'FUNC_ADMIN') {
    const icons = [<PersonAddIcon color="primary" />, <AdminPanelSettingsIcon color="warning" />, <UpdateIcon color="info" />, <SecurityIcon color="success" />];
    return icons[i % icons.length];
  }
  if (role === 'ANALYST') {
    const icons = [<AssignmentLateIcon color="warning" />, <SecurityIcon color="error" />, <UpdateIcon color="info" />];
    return icons[i % icons.length];
  }
  const icons = [<AssignmentLateIcon color="error" />, <UpdateIcon color="info" />, <NotificationsActiveIcon color="success" />];
  return icons[i % icons.length];
};

export default function Notifications() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('USER');

  useEffect(() => {
    // Дізнаємось роль з /api/auth/me
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(u => setRole(u.role || 'USER'))
      .catch(() => {});

    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        setNotifs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Щойно';
    if (diff < 3600) return `${Math.floor(diff / 60)} хв. тому`;
    if (diff < 86400) return `Сьогодні, ${d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
    if (diff < 172800) return `Вчора, ${d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('uk-UA');
  };

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 4 }}>Сповіщення</Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>
      ) : notifs.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <InboxIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h3" color="text.secondary">Немає сповіщень</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Нові сповіщення з'являться тут автоматично.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 2 }}>
          <List sx={{ p: 0 }}>
            {notifs.map((notif, index) => (
              <div key={notif.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    p: 3,
                    '&:hover': { bgcolor: '#f5f5f5' },
                    bgcolor: notif.is_read ? 'transparent' : '#f0f7ff',
                    borderLeft: notif.is_read ? 'none' : '3px solid #1976d2',
                  }}
                >
                  <ListItemIcon sx={{ mt: 0.5 }}>
                    {iconForIndex(index, role)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="h3" sx={{ fontWeight: notif.is_read ? 'normal' : 'bold' }}>
                          {notif.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notif.created_at)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body1" color="text.secondary">
                        {notif.message}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < notifs.length - 1 && <Divider component="li" />}
              </div>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
