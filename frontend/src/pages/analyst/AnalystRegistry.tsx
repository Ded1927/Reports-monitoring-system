import { Box, Typography, Paper, Tab, Tabs, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, TextField, InputAdornment } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReplayIcon from '@mui/icons-material/Replay';

const statusLabel: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'default' }> = {
  SUBMITTED: { label: 'Подано', color: 'success' },
  RETURNED: { label: 'На доопрацюванні', color: 'error' },
  ARCHIVED: { label: 'Архівовано', color: 'default' },
};

export default function AnalystRegistry() {
  const [tab, setTab] = useState(0);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/reports/all')
      .then(r => r.json())
      .then(data => { setReports(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

  const active = reports.filter(r => r.status === 'SUBMITTED');
  const returned = reports.filter(r => r.status === 'RETURNED');
  const archived = reports.filter(r => r.status === 'ARCHIVED');
  const tabData = [active, returned, archived][tab];

  const filtered = tabData.filter(r =>
    (r.author_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.template_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleReturn = async (reportId: string) => {
    await fetch(`/api/reports/${reportId}/return`, { method: 'POST' });
    const data = await fetch('/api/reports/all').then(r => r.json());
    setReports(Array.isArray(data) ? data : []);
  };

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 4 }}>Реєстр звітів</Typography>
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch(''); }} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab label={`Актуальні (${active.length})`} sx={{ fontWeight: 600, py: 2 }} />
          <Tab label={`На доопрацюванні (${returned.length})`} sx={{ fontWeight: 600, py: 2 }} />
          <Tab label={`Архів (${archived.length})`} sx={{ fontWeight: 600, py: 2 }} />
        </Tabs>
      </Paper>
      <TextField fullWidth placeholder="Пошук..." value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ mb: 3 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {filtered.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Методика</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Дата</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Статус</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(r => {
                  const s = statusLabel[r.status] || { label: r.status, color: 'default' as const };
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.author_email}</TableCell>
                      <TableCell>{r.template_name}</TableCell>
                      <TableCell>{r.created_at ? new Date(r.created_at).toLocaleDateString('uk-UA') : '—'}</TableCell>
                      <TableCell><Chip label={s.label} color={s.color} size="small" /></TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => navigate(`/report/${r.id}`)}>Відкрити</Button>
                          {tab === 0 && <Button variant="outlined" size="small" color="warning" startIcon={<ReplayIcon />} onClick={() => handleReturn(r.id)}>Повернути</Button>}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="body1" color="text.secondary">Немає звітів.</Typography></Box>
        )}
      </Paper>
    </Box>
  );
}
