import { Box, Typography, Paper, Tab, Tabs, CircularProgress, Chip, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';

export default function Assessments() {
  const [tabIndex, setTabIndex] = useState(0);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/reports/my')
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  }

  // Відфільтруємо звіти за типом (моково, оскільки template_type ми додали в API, але можемо перевірити)
  const isSelfAssessment = tabIndex === 0;
  
  // Фільтрація: беремо всі звіти, де template_type відповідає вибраній вкладці. 
  // Якщо template_type немає, то орієнтуємось на назву шаблону.
  const filteredReports = reports.filter(r => {
    if (r.template_type) {
      return isSelfAssessment ? r.template_type === 'SELF_ASSESSMENT' : r.template_type === 'EXTERNAL_AUDIT';
    }
    return isSelfAssessment ? r.template_name.includes('Самооцінювання') : !r.template_name.includes('Самооцінювання');
  });

  const latestReport = filteredReports.length > 0 ? filteredReports[0] : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Оцінювання</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => navigate('/archive')}
          >
            Архів звітів
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/report/new')}
          >
            Нове оцінювання
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 4, borderRadius: 2 }}>
        <Tabs 
          value={tabIndex} 
          onChange={(e, val) => setTabIndex(val)} 
          indicatorColor="primary" 
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Самооцінювання" sx={{ fontWeight: 600, py: 2 }} />
          <Tab label="Зовнішнє оцінювання" sx={{ fontWeight: 600, py: 2 }} />
        </Tabs>
      </Paper>

      {latestReport ? (
        <Box>
          <Typography variant="h3" sx={{ mb: 2 }}>Остання аналітика: {latestReport.template_name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Дата подачі: {latestReport.created_at ? new Date(latestReport.created_at).toLocaleString('uk-UA') : 'Невідомо'} | Статус: <Chip label={latestReport.status === 'SUBMITTED' ? 'Подано' : latestReport.status === 'DRAFT' ? 'Чернетка' : latestReport.status} size="small" />
          </Typography>
          
          {/* Коротке відображення аналітики */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
              <CircularProgress variant="determinate" value={85} size={80} thickness={5} sx={{ color: 'success.main', mb: 2 }} />
              <Typography variant="body1" fontWeight="bold">Управління ризиками</Typography>
              <Typography variant="caption" color="text.secondary">Загальний показник</Typography>
            </Paper>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
              <CircularProgress variant="determinate" value={60} size={80} thickness={5} sx={{ color: 'warning.main', mb: 2 }} />
              <Typography variant="body1" fontWeight="bold">Безпека мереж</Typography>
              <Typography variant="caption" color="text.secondary">Потребує уваги</Typography>
            </Paper>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
              <CircularProgress variant="determinate" value={100} size={80} thickness={5} sx={{ color: 'success.main', mb: 2 }} />
              <Typography variant="body1" fontWeight="bold">Контроль доступу</Typography>
              <Typography variant="caption" color="text.secondary">Відмінно</Typography>
            </Paper>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
              <CircularProgress variant="determinate" value={45} size={80} thickness={5} sx={{ color: 'error.main', mb: 2 }} />
              <Typography variant="body1" fontWeight="bold">Моніторинг</Typography>
              <Typography variant="caption" color="text.secondary">Критичний стан</Typography>
            </Paper>
          </Box>
          <Button variant="outlined" sx={{ mt: 4 }} onClick={() => navigate(`/report/${latestReport.id}`)}>
            Переглянути повний звіт
          </Button>
        </Box>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: '#f9f9f9' }}>
          <Typography variant="h3" color="text.secondary" sx={{ mb: 2 }}>Немає даних</Typography>
          <Typography variant="body1" color="text.secondary">
            У вас ще немає звітів у цій категорії. Натисніть "Нове оцінювання", щоб розпочати.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
