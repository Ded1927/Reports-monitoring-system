import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Divider, CircularProgress, Button, IconButton, Tooltip, Chip } from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import UpdateIcon from '@mui/icons-material/Update';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import InboxIcon from '@mui/icons-material/Inbox';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DoneIcon from '@mui/icons-material/Done';
import { useAuth } from '../context/AuthContext';

const ICONS_BY_ROLE: Record<string, JSX.Element[]> = {
  FUNC_ADMIN: [<PersonAddIcon color="primary" />, <AdminPanelSettingsIcon color="warning" />, <UpdateIcon color="info" />, <SecurityIcon color="success" />],
  ANALYST:    [<AssignmentLateIcon color="warning" />, <SecurityIcon color="error" />, <UpdateIcon color="info" />],
  USER:       [<AssignmentLateIcon color="error" />, <UpdateIcon color="info" />, <NotificationsActiveIcon color="success" />],
};

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

export default function Notifications() {
  const { user } = useAuth();
  const role = (user?.role as string) || 'USER';
  const icons = ICONS_BY_ROLE[role] || ICONS_BY_ROLE.USER;

  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  const fetchNotifs = useCallback(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        setNotifs(Array.isArray(data) ? data : (data.items ?? []));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const unreadCount = notifs.filter(n => !n.is_read).length;

  const markOne = async (id: string) => {
    setMarking(id);
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setMarking(null);
  };

  const markAll = async () => {
    setMarking('all');
    await fetch('/api/notifications/read-all', { method: 'POST' });
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    setMarking(null);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h1">Сповіщення</Typography>
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} нових`} color="primary" size="small" sx={{ fontWeight: 700 }} />
          )}
        </Box>
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={marking === 'all' ? <CircularProgress size={16} /> : <DoneAllIcon />}
            onClick={markAll}
            disabled={marking !== null}
            size="small"
          >
            Позначити всі як прочитані
          </Button>
        )}
      </Box>

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
                    pr: 2,
                    '&:hover': { bgcolor: notif.is_read ? '#f5f5f5' : '#e3f0ff' },
                    bgcolor: notif.is_read ? 'transparent' : '#f0f7ff',
                    borderLeft: notif.is_read ? '3px solid transparent' : '3px solid #1976d2',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <ListItemIcon sx={{ mt: 0.5 }}>
                    {icons[index % icons.length]}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                        <Typography
                          variant="h3"
                          sx={{ fontWeight: notif.is_read ? 500 : 700, color: notif.is_read ? 'text.secondary' : 'text.primary' }}
                        >
                          {notif.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2, flexShrink: 0 }}>
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
                  {/* Кнопка "прочитано" для непрочитаних */}
                  {!notif.is_read && (
                    <Tooltip title="Позначити як прочитане">
                      <IconButton
                        size="small"
                        onClick={() => markOne(notif.id)}
                        disabled={marking !== null}
                        sx={{ ml: 1, mt: 0.5, flexShrink: 0, color: 'primary.main' }}
                      >
                        {marking === notif.id
                          ? <CircularProgress size={18} />
                          : <DoneIcon fontSize="small" />
                        }
                      </IconButton>
                    </Tooltip>
                  )}
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
