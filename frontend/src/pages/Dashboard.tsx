import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';

export default function Dashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/reports/my')
      .then(res => res.json())
      .then(data => setReports(data))
      .catch(console.error);
  }, []);

  const getStatusChip = (status: string) => {
    if (status === 'DRAFT') return <Chip label="Чернетка" color="warning" size="small" />;
    if (status === 'SUBMITTED') return <Chip label="Подано" color="success" size="small" />;
    return <Chip label={status} size="small" />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h1">Мої Звіти</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/report/new')}
        >
          Створити новий звіт
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Шаблон</strong></TableCell>
              <TableCell><strong>Статус</strong></TableCell>
              <TableCell><strong>Дата створення</strong></TableCell>
              <TableCell align="right"><strong>Дія</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  У вас ще немає жодного звіту. Натисніть "Створити новий звіт".
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>{report.template_name}</TableCell>
                  <TableCell>{getStatusChip(report.status)}</TableCell>
                  <TableCell>{new Date(report.created_at).toLocaleString('uk-UA')}</TableCell>
                  <TableCell align="right">
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => navigate(`/report/${report.id}`)}
                    >
                      {report.status === 'DRAFT' ? 'Продовжити' : 'Переглянути'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
