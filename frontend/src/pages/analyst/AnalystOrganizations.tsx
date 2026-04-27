import { Box, Typography, Paper, TextField, InputAdornment, Tab, Tabs, Chip, Button, CircularProgress } from '@mui/material';
import { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import AssessmentIcon from '@mui/icons-material/Assessment';
import WarningIcon from '@mui/icons-material/Warning';

const mockOrgs = [
  { id: 1, name: 'МОЗ України', sector: 'Охорона здоров\'я', region: 'Київ', score: 82, status: 'ok', lastReport: '15.03.2026' },
  { id: 2, name: 'Мінфін України', sector: 'Фінанси', region: 'Київ', score: 91, status: 'ok', lastReport: '02.01.2026' },
  { id: 3, name: 'ДПСУ', sector: 'Оборона', region: 'Київ', score: 56, status: 'attention', lastReport: '10.10.2025' },
  { id: 4, name: 'ОДА Харківська', sector: 'Держуправління', region: 'Харків', score: 73, status: 'ok', lastReport: '28.03.2026' },
  { id: 5, name: 'ХНУРЕ', sector: 'Освіта', region: 'Харків', score: 45, status: 'attention', lastReport: '05.07.2025' },
  { id: 6, name: 'НБУ', sector: 'Фінанси', region: 'Київ', score: 97, status: 'ok', lastReport: '01.04.2026' },
];

const sectors = ['Всі', ...Array.from(new Set(mockOrgs.map(o => o.sector)))];
const regions = ['Всі', ...Array.from(new Set(mockOrgs.map(o => o.region)))];

export default function AnalystOrganizations() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('Всі');
  const [region, setRegion] = useState('Всі');
  const [selected, setSelected] = useState<typeof mockOrgs[0] | null>(null);

  const tabs = [{ label: 'Пошук' }, { label: 'По секторах' }, { label: 'По регіонах' }, { label: 'Потребують уваги' }];

  const filterOrgs = (list: typeof mockOrgs) => list.filter(o =>
    (o.name.toLowerCase().includes(search.toLowerCase())) &&
    (sector === 'Всі' || o.sector === sector) &&
    (region === 'Всі' || o.region === region)
  );

  const displayOrgs = tab === 3
    ? filterOrgs(mockOrgs.filter(o => o.status === 'attention' || o.score < 70))
    : filterOrgs(mockOrgs);

  const scoreColor = (s: number) => s >= 85 ? 'success' : s >= 65 ? 'warning' : 'error';

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 4 }}>Організації</Typography>
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary" variant="fullWidth">
          {tabs.map((t, i) => <Tab key={i} label={t.label} sx={{ fontWeight: 600, py: 2 }} />)}
        </Tabs>
      </Paper>

      {selected ? (
        <Box>
          <Button onClick={() => setSelected(null)} sx={{ mb: 2 }}>← Назад до списку</Button>
          <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h2">{selected.name}</Typography>
                <Typography variant="body2" color="text.secondary">{selected.sector} · {selected.region}</Typography>
              </Box>
              <Box sx={{ ml: 'auto' }}>
                <Chip label={`${selected.score}%`} color={scoreColor(selected.score)} size="medium" sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }} />
              </Box>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                <AssessmentIcon sx={{ color: 'primary.main', fontSize: 32, mb: 1 }} />
                <Typography variant="h3">Останній звіт</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Дата: {selected.lastReport}</Typography>
                <Chip label={`${selected.score}% відповідності`} color={scoreColor(selected.score)} size="small" sx={{ mt: 1 }} />
              </Paper>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                <WarningIcon sx={{ color: 'warning.main', fontSize: 32, mb: 1 }} />
                <Typography variant="h3">Проблемні питання</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Відповіді "Негативно": 3</Typography>
                <Typography variant="body2" color="text.secondary">Відповіді "Заплановано": 7</Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                <AssessmentIcon sx={{ color: 'text.secondary', fontSize: 32, mb: 1 }} />
                <Typography variant="h3">Попередні звіти</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Всього звітів: 2</Typography>
                <Button size="small" sx={{ mt: 1 }}>Переглянути архів</Button>
              </Paper>
            </Box>
          </Paper>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField fullWidth placeholder="Пошук організації..." value={search} onChange={e => setSearch(e.target.value)} size="small" InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {displayOrgs.map(org => (
              <Paper key={org.id} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { boxShadow: 3 }, transition: '0.2s' }} onClick={() => setSelected(org)}>
                <BusinessIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" fontWeight="bold">{org.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{org.sector} · {org.region} · Останній звіт: {org.lastReport}</Typography>
                </Box>
                <Chip label={`${org.score}%`} color={scoreColor(org.score)} size="small" sx={{ fontWeight: 700 }} />
              </Paper>
            ))}
            {displayOrgs.length === 0 && <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Нічого не знайдено</Typography>}
          </Box>
        </Box>
      )}
    </Box>
  );
}
