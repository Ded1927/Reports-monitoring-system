import { Box, Typography, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, IconButton } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function Archive() {
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

  const getStatusChip = (status: string) => {
    switch(status) {
      case 'SUBMITTED': return <Chip label="Подано" color="success" size="small" />;
      case 'RETURNED': return <Chip label="На доопрацюванні" color="error" size="small" />;
      case 'DRAFT': return <Chip label="Чернетка" color="warning" size="small" />;
      case 'ARCHIVED': return <Chip label="Архівовано" color="default" size="small" />;
      default: return <Chip label={status} size="small" />;
    }
  };

  const getTypeLabel = (type: string, name: string) => {
    if (type === 'SELF_ASSESSMENT') return 'Самооцінювання';
    if (type === 'EXTERNAL_AUDIT') return 'Зовнішнє оцінювання';
    if (name.includes('Самооцінювання')) return 'Самооцінювання';
    return 'Зовнішнє оцінювання';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate('/assessments')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h1">Архів звітів</Typography>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {reports.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Тип</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Назва методики</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Дата створення</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Статус</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>{getTypeLabel(report.template_type, report.template_name)}</TableCell>
                    <TableCell>{report.template_name}</TableCell>
                    <TableCell>{report.created_at ? new Date(report.created_at).toLocaleDateString('uk-UA') : '—'}</TableCell>
                    <TableCell>{getStatusChip(report.status)}</TableCell>
                    <TableCell align="right">
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/report/${report.id}`)}
                      >
                        Переглянути
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">У вас поки немає жодного звіту.</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
