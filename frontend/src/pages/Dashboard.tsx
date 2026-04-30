import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Chip, CircularProgress, 
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

export default function Dashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNewReportDialog, setOpenNewReportDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/reports/my')
      .then(res => res.json())
      .then(data => {
        setReports(Array.isArray(data) ? data : (data.items ?? []));
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

  const latestReport = reports.length > 0 ? reports[0] : null;
  const returnedReport = reports.find(r => r.status === 'RETURNED');
  
  const lastSubmittedReport = reports.find(r => r.status === 'SUBMITTED');
  
  let nextAssessmentDate: Date | null = null;
  let daysLeft: number | null = null;

  if (lastSubmittedReport && lastSubmittedReport.created_at) {
    // В ідеалі використовувати date_submitted, але поки маємо created_at
    const lastDate = new Date(lastSubmittedReport.created_at);
    nextAssessmentDate = new Date(lastDate);
    nextAssessmentDate.setFullYear(nextAssessmentDate.getFullYear() + 1);
    
    const diffTime = nextAssessmentDate.getTime() - new Date().getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const mockScore = latestReport ? 85 : 0; 

  // Єдиний стиль для всіх карток для абсолютної симетрії
  const baseCardStyle = {
    p: 3, 
    height: 300, // Фіксована висота для всіх карток (як у блоку про наступне оцінювання)
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 3, 
    transition: 'transform 0.2s, box-shadow 0.2s',
  };

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 4 }}>Головна</Typography>

      {/* Використовуємо жорстку CSS Grid для ідеальної математичної симетрії */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        
        {/* Блок 1: Останній звіт */}
        <Paper 
          elevation={1} 
          sx={{ 
            ...baseCardStyle,
            cursor: latestReport ? 'pointer' : 'default',
            '&:hover': latestReport ? { transform: 'translateY(-4px)', boxShadow: 3 } : {}
          }}
          onClick={() => {
            if (latestReport) navigate(`/report/${latestReport.id}`);
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AssessmentIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
            <Typography variant="h3">Останній звіт</Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            {latestReport ? (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {latestReport.template_name}
                </Typography>
                <Chip 
                  label={latestReport.status === 'SUBMITTED' ? 'Подано' : latestReport.status === 'DRAFT' ? 'Чернетка' : latestReport.status} 
                  color={latestReport.status === 'SUBMITTED' ? 'success' : 'warning'} 
                  size="small" 
                  sx={{ mb: 3 }} 
                />
                
                {/* Компактна діаграма */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                    <CircularProgress variant="determinate" value={100} sx={{ color: '#eee' }} size={60} thickness={5} />
                    <CircularProgress variant="determinate" value={mockScore} sx={{ color: '#000', position: 'absolute', left: 0 }} size={60} thickness={5} />
                    <Box
                      sx={{
                        top: 0, left: 0, bottom: 0, right: 0, position: 'absolute',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" component="div" color="text.secondary" fontWeight="bold">
                        {mockScore}%
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Загальний рівень кіберзахисту
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Ви ще не подавали звітів.
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Блок 2: На доопрацюванні */}
        <Paper 
          elevation={1} 
          sx={{ 
            ...baseCardStyle,
            cursor: returnedReport ? 'pointer' : 'default',
            bgcolor: returnedReport ? '#fff' : '#f9f9f9',
            opacity: returnedReport ? 1 : 0.7,
            '&:hover': returnedReport ? { transform: 'translateY(-4px)', boxShadow: 3 } : {}
          }}
          onClick={() => {
            if (returnedReport) navigate(`/report/${returnedReport.id}`);
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AssignmentLateIcon color={returnedReport ? "error" : "disabled"} sx={{ fontSize: 32, mr: 2 }} />
            <Typography variant="h3" color={returnedReport ? "error" : "text.secondary"}>
              На доопрацюванні
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            {returnedReport ? (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Звіт повернуто аналітиком. Він потребує вашої уваги та виправлень.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {returnedReport.template_name}
                </Typography>
                <Chip label="Потребує уваги" color="error" size="small" />
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Немає звітів, що потребують коригувань.
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Блок 3: Наступне оцінювання */}
        <Paper 
          elevation={1} 
          sx={{ 
            ...baseCardStyle,
            cursor: 'pointer',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
          }}
          onClick={() => setOpenNewReportDialog(true)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EventAvailableIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
            <Typography variant="h3">Наступне оцінювання</Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            {nextAssessmentDate ? (
              <Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Дедлайн подачі: <strong>{nextAssessmentDate.toLocaleDateString('uk-UA')}</strong>
                </Typography>
                {daysLeft !== null && (
                  <Typography variant="h4" sx={{ color: daysLeft < 30 ? 'error.main' : 'success.main', mt: 2, mb: 2 }}>
                    Залишилось {daysLeft} днів
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Натисніть тут, щоб розпочати процес заповнення нового звіту.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Оцінювання ще не проводилось. Настав час подати ваш перший звіт!
                </Typography>
                <Button variant="outlined" color="primary">Почати оцінювання</Button>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Блок 4: Останні сповіщення */}
        <Paper 
          elevation={1} 
          sx={{ 
            ...baseCardStyle,
            cursor: 'pointer',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <NotificationsActiveIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
            <Typography variant="h3">Останні сповіщення</Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'flex-start' }}>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, borderLeft: '4px solid #000' }}>
              <Typography variant="body2" fontWeight="bold">Вітаємо в системі!</Typography>
              <Typography variant="caption" color="text.secondary">Ваш обліковий запис успішно підключено. Можете починати роботу.</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, borderLeft: '4px solid #2196f3' }}>
              <Typography variant="body2" fontWeight="bold">Оновлення методики</Typography>
              <Typography variant="caption" color="text.secondary">Опубліковано нову версію стандарту щодо базових вимог кіберзахисту.</Typography>
            </Box>
          </Box>
        </Paper>

      </Box>

      {/* Діалогове вікно "Почати нове оцінювання" */}
      <Dialog 
        open={openNewReportDialog} 
        onClose={() => setOpenNewReportDialog(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Розпочати нове оцінювання?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ви збираєтесь розпочати заповнення нового звіту про стан кіберзахисту. Ви зможете зберегти його як чернетку і повернутись до заповнення пізніше.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenNewReportDialog(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Скасувати
          </Button>
          <Button 
            onClick={() => {
              setOpenNewReportDialog(false);
              navigate('/report/new');
            }} 
            variant="contained" 
            color="primary"
          >
            Подати новий звіт
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
