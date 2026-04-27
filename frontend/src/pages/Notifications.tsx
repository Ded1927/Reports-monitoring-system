import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Divider } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import UpdateIcon from '@mui/icons-material/Update';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';

export default function Notifications() {
  const notifications = [
    {
      id: 1,
      title: 'Звіт повернуто на доопрацювання',
      message: 'Ваш звіт "Самооцінювання стану кіберзахисту" було перевірено аналітиком та повернуто на доопрацювання. Будь ласка, зверніть увагу на коментарі.',
      date: 'Сьогодні, 14:30',
      type: 'warning',
      icon: <AssignmentLateIcon color="error" />
    },
    {
      id: 2,
      title: 'Оновлення методики',
      message: 'Опубліковано нову версію стандарту щодо базових вимог кіберзахисту. Ознайомтесь зі змінами до початку наступного оцінювання.',
      date: 'Вчора, 10:15',
      type: 'info',
      icon: <UpdateIcon color="info" />
    },
    {
      id: 3,
      title: 'Вітаємо в системі!',
      message: 'Ваш обліковий запис успішно підключено. Можете починати роботу та заповнення першого звіту.',
      date: '3 дні тому',
      type: 'success',
      icon: <NotificationsActiveIcon color="success" />
    }
  ];

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 4 }}>Сповіщення</Typography>

      <Paper sx={{ borderRadius: 2 }}>
        <List sx={{ p: 0 }}>
          {notifications.map((notif, index) => (
            <div key={notif.id}>
              <ListItem alignItems="flex-start" sx={{ p: 3, '&:hover': { bgcolor: '#f5f5f5' } }}>
                <ListItemIcon sx={{ mt: 0.5 }}>
                  {notif.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="h3">{notif.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{notif.date}</Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body1" color="text.secondary">
                      {notif.message}
                    </Typography>
                  }
                />
              </ListItem>
              {index < notifications.length - 1 && <Divider component="li" />}
            </div>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
