import { Box, Typography, Paper, Chip, Button, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import ArticleIcon from '@mui/icons-material/Article';

export default function AnalystHome() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/reports/all')
      .then(r => r.json())
      .then(data => { setReports(Array.isArray(data) ? data : (data.items ?? [])); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

  const returned = reports.filter(r => r.status === 'RETURNED');
  const submitted = reports.filter(r => r.status === 'SUBMITTED');

  // Мокові прострочені (організації без звітів за останній рік)
  const overdueMock = [
    { name: 'МОЗ України', daysOverdue: 32 },
    { name: 'Мінфін України', daysOverdue: 15 },
    { name: 'ДПСУ', daysOverdue: 7 },
  ];

  const cardStyle = {
    p: 3,
    height: 280,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 3,
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
  };

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 4 }}>Головна</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>

        {/* Протерміновані */}
        <Paper elevation={1} sx={{ ...cardStyle, borderTop: '4px solid #d32f2f' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WarningAmberIcon sx={{ color: 'error.main', fontSize: 30, mr: 1.5 }} />
            <Typography variant="h3" color="error.main">Протерміновані оцінювання</Typography>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {overdueMock.map(o => (
              <Box key={o.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: '#fff5f5', borderRadius: 2 }}>
                <Typography variant="body2" fontWeight="bold">{o.name}</Typography>
                <Chip label={`+${o.daysOverdue} днів`} color="error" size="small" />
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {overdueMock.length} організацій не подали звіт вчасно
          </Typography>
        </Paper>

        {/* На доопрацюванні */}
        <Paper elevation={1} sx={{ ...cardStyle, borderTop: '4px solid #ed6c02' }} onClick={() => navigate('/registry')}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AssignmentLateIcon sx={{ color: 'warning.main', fontSize: 30, mr: 1.5 }} />
            <Typography variant="h3" color="warning.main">На доопрацюванні</Typography>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {returned.length > 0 ? returned.slice(0, 4).map(r => (
              <Box key={r.id} sx={{ p: 1.5, bgcolor: '#fff8f0', borderRadius: 2, borderLeft: '3px solid #ed6c02' }}>
                <Typography variant="body2" fontWeight="bold">{r.author_email}</Typography>
                <Typography variant="caption" color="text.secondary">{r.template_name}</Typography>
              </Box>
            )) : (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Немає звітів на доопрацюванні
              </Typography>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {returned.length} звітів очікують на доопрацювання
          </Typography>
        </Paper>

        {/* Останні подані */}
        <Paper elevation={1} sx={{ ...cardStyle, borderTop: '4px solid #1976d2' }} onClick={() => navigate('/registry')}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ArticleIcon sx={{ color: 'primary.main', fontSize: 30, mr: 1.5 }} />
            <Typography variant="h3">Останні подані звіти</Typography>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {submitted.length > 0 ? submitted.slice(0, 4).map(r => (
              <Box key={r.id} sx={{ p: 1.5, bgcolor: '#f0f7ff', borderRadius: 2, borderLeft: '3px solid #1976d2' }}>
                <Typography variant="body2" fontWeight="bold">{r.author_email}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {r.template_name} · {r.created_at ? new Date(r.created_at).toLocaleDateString('uk-UA') : ''}
                </Typography>
              </Box>
            )) : (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Немає нових поданих звітів
              </Typography>
            )}
          </Box>
          <Button size="small" sx={{ mt: 1, alignSelf: 'flex-start' }} onClick={e => { e.stopPropagation(); navigate('/registry'); }}>
            Переглянути всі →
          </Button>
        </Paper>

      </Box>
    </Box>
  );
}
