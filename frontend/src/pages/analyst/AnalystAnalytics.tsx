import { Box, Typography, Paper, Tab, Tabs, CircularProgress, LinearProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const sectorData = [
  { name: 'Охорона здоров\'я', score: 82, count: 14 },
  { name: 'Фінанси', score: 91, count: 23 },
  { name: 'Транспорт', score: 67, count: 9 },
  { name: 'Енергетика', score: 74, count: 18 },
  { name: 'Освіта', score: 58, count: 31 },
  { name: 'Оборона', score: 95, count: 7 },
];

const regionData = [
  { name: 'Київська обл.', score: 88 },
  { name: 'Харківська обл.', score: 72 },
  { name: 'Дніпропетровська обл.', score: 79 },
  { name: 'Одеська обл.', score: 65 },
  { name: 'Львівська обл.', score: 83 },
];

const scoreColor = (s: number) => s >= 85 ? '#2e7d32' : s >= 65 ? '#ed6c02' : '#d32f2f';

export default function AnalystAnalytics() {
  const [tab, setTab] = useState(0);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/all')
      .then(r => r.json())
      .then(data => { setReports(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

  const totalReports = reports.length;
  const submittedCount = reports.filter(r => r.status === 'SUBMITTED').length;
  const returnedCount = reports.filter(r => r.status === 'RETURNED').length;

  // Очікуються протягом наступного місяця:
  // Беремо лише SUBMITTED звіти, дедлайн = created_at + 1 рік.
  // Рахуємо ті, чий дедлайн вже минув АБО настане впродовж наступних 30 днів.
  const now = new Date();
  const in30days = new Date(now);
  in30days.setDate(in30days.getDate() + 30);

  const upcomingCount = reports.filter(r => {
    if (r.status !== 'SUBMITTED' || !r.created_at) return false;
    const deadline = new Date(r.created_at);
    deadline.setFullYear(deadline.getFullYear() + 1);
    // включаємо прострочені (deadline < now) та ті що у межах 30 днів
    return deadline <= in30days;
  }).length;

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 4 }}>Дашборд</Typography>

      <Paper sx={{ mb: 4, borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Загальний стан" sx={{ fontWeight: 600, py: 2 }} />
          <Tab icon={<GroupIcon />} iconPosition="start" label="Стан по сектору" sx={{ fontWeight: 600, py: 2 }} />
          <Tab icon={<LocationOnIcon />} iconPosition="start" label="Стан по регіону" sx={{ fontWeight: 600, py: 2 }} />
          <Tab icon={<EmojiEventsIcon />} iconPosition="start" label="Динаміка / рейтинги" sx={{ fontWeight: 600, py: 2 }} />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4 }}>
            {[
              { label: 'Всього звітів', value: totalReports, color: '#1976d2' },
              { label: 'Подано / На перевірці', value: submittedCount, color: '#2e7d32' },
              { label: 'На доопрацюванні', value: returnedCount, color: '#d32f2f' },
              { label: 'Очікується протягом місяця', value: upcomingCount, color: '#7b1fa2' },
            ].map(s => (
              <Paper key={s.label} sx={{ p: 3, borderRadius: 3, textAlign: 'center', borderTop: `4px solid ${s.color}` }}>
                <Typography variant="h2" sx={{ color: s.color, fontWeight: 800, fontSize: '3rem' }}>{s.value}</Typography>
                <Typography variant="body1" color="text.secondary">{s.label}</Typography>
              </Paper>
            ))}
          </Box>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h3" sx={{ mb: 3 }}>Середній рівень відповідності</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress variant="determinate" value={100} sx={{ color: '#eee' }} size={120} thickness={6} />
                <CircularProgress variant="determinate" value={78} sx={{ color: '#1976d2', position: 'absolute', left: 0 }} size={120} thickness={6} />
                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h3" fontWeight="bold">78%</Typography>
                </Box>
              </Box>
              <Typography variant="body1" color="text.secondary">
                Середній рівень відповідності базовим вимогам кіберзахисту серед усіх організацій, що подали звіти.
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h3" sx={{ mb: 3 }}>Рівень кіберзахисту по секторах</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sectorData.map(s => (
              <Box key={s.name}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body1" fontWeight="bold">{s.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">{s.count} орг.</Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ color: scoreColor(s.score), minWidth: 40, textAlign: 'right' }}>{s.score}%</Typography>
                  </Box>
                </Box>
                <LinearProgress variant="determinate" value={s.score} sx={{ height: 10, borderRadius: 5, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: scoreColor(s.score), borderRadius: 5 } }} />
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h3" sx={{ mb: 3 }}>Рівень кіберзахисту по регіонах</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {regionData.map(r => (
              <Box key={r.name}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body1" fontWeight="bold">{r.name}</Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ color: scoreColor(r.score) }}>{r.score}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={r.score} sx={{ height: 10, borderRadius: 5, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: scoreColor(r.score), borderRadius: 5 } }} />
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {tab === 3 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h3" sx={{ mb: 3 }}>Рейтинг організацій</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { rank: 1, name: 'Мінфін України', score: 96, trend: '+3%' },
              { rank: 2, name: 'СБУ', score: 94, trend: '+1%' },
              { rank: 3, name: 'НБУ', score: 91, trend: '-2%' },
              { rank: 4, name: 'МЗС України', score: 88, trend: '+5%' },
              { rank: 5, name: 'ДТСЗІ', score: 85, trend: '0%' },
            ].map(org => (
              <Box key={org.rank} sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: org.rank === 1 ? '#fffde7' : '#f9f9f9', borderRadius: 2, gap: 2 }}>
                <Typography variant="h3" sx={{ minWidth: 32, color: org.rank <= 3 ? '#ed6c02' : 'text.secondary' }}>#{org.rank}</Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ flexGrow: 1 }}>{org.name}</Typography>
                <Typography variant="body2" sx={{ color: org.trend.startsWith('+') ? 'success.main' : org.trend.startsWith('-') ? 'error.main' : 'text.secondary' }}>{org.trend}</Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: scoreColor(org.score), minWidth: 50, textAlign: 'right' }}>{org.score}%</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
