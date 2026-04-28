import { Box, Typography, Paper, CircularProgress } from '@mui/material';

const mockLog = [
  { id: 1, user: 'admin@cyber.gov.ua', action: 'Створено користувача', target: 'analyst@cyber.gov.ua', time: '28.04.2026 09:15', ip: '192.168.1.10' },
  { id: 2, user: 'admin@cyber.gov.ua', action: 'Змінено роль користувача', target: 'user@test.ua → ANALYST', time: '28.04.2026 08:40', ip: '192.168.1.10' },
  { id: 3, user: 'admin@cyber.gov.ua', action: 'Видалено організацію', target: 'Тестова Org LLC', time: '27.04.2026 17:20', ip: '192.168.1.10' },
  { id: 4, user: 'admin@cyber.gov.ua', action: 'Додано організацію', target: 'МОЗ України', time: '27.04.2026 14:05', ip: '10.0.0.5' },
  { id: 5, user: 'admin@cyber.gov.ua', action: 'Оновлено шаблон звіту', target: 'Самооцінювання v1.1', time: '26.04.2026 11:30', ip: '192.168.1.10' },
  { id: 6, user: 'admin@cyber.gov.ua', action: 'Деактивовано користувача', target: 'old_user@test.ua', time: '25.04.2026 16:00', ip: '192.168.1.10' },
];

export default function AdminAuditLog() {
  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 4 }}>Журнал дій</Typography>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: '#f5f5f5', display: 'grid', gridTemplateColumns: '2fr 3fr 2fr 1fr', gap: 2 }}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary">АДМІНІСТРАТОР</Typography>
          <Typography variant="caption" fontWeight="bold" color="text.secondary">ДІЯ / ОБ'ЄКТ</Typography>
          <Typography variant="caption" fontWeight="bold" color="text.secondary">ЧАС</Typography>
          <Typography variant="caption" fontWeight="bold" color="text.secondary">IP</Typography>
        </Box>
        {mockLog.map((entry, i) => (
          <Box key={entry.id} sx={{ p: 2, display: 'grid', gridTemplateColumns: '2fr 3fr 2fr 1fr', gap: 2, alignItems: 'center', bgcolor: i % 2 === 0 ? '#fff' : '#fafafa', borderTop: '1px solid #f0f0f0' }}>
            <Typography variant="body2">{entry.user}</Typography>
            <Box>
              <Typography variant="body2" fontWeight="bold">{entry.action}</Typography>
              <Typography variant="caption" color="text.secondary">{entry.target}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">{entry.time}</Typography>
            <Typography variant="caption" color="text.secondary">{entry.ip}</Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
