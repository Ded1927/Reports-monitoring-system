import {
  Box, Typography, Paper, TextField, InputAdornment, Chip, Button,
  Checkbox, FormControlLabel, Divider, CircularProgress, Tooltip
} from '@mui/material';
import { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import AssessmentIcon from '@mui/icons-material/Assessment';
import WarningIcon from '@mui/icons-material/Warning';
import FilterListIcon from '@mui/icons-material/FilterList';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const mockOrgs = [
  { id: 1, name: 'МОЗ України', sector: 'Охорона здоров\'я', region: 'Київ', score: 82, lastReportDate: '2024-03-15' },
  { id: 2, name: 'Мінфін України', sector: 'Фінанси', region: 'Київ', score: 91, lastReportDate: '2025-06-02' },
  { id: 3, name: 'ДПСУ', sector: 'Оборона', region: 'Київ', score: 56, lastReportDate: '2024-10-10' },
  { id: 4, name: 'ОДА Харківська', sector: 'Держуправління', region: 'Харківська обл.', score: 73, lastReportDate: '2025-03-28' },
  { id: 5, name: 'ХНУРЕ', sector: 'Освіта', region: 'Харківська обл.', score: 45, lastReportDate: '2024-07-05' },
  { id: 6, name: 'НБУ', sector: 'Фінанси', region: 'Київ', score: 97, lastReportDate: '2025-04-01' },
  { id: 7, name: 'КНУ ім. Шевченка', sector: 'Освіта', region: 'Київ', score: 61, lastReportDate: '2024-11-20' },
  { id: 8, name: 'Укренерго', sector: 'Енергетика', region: 'Київ', score: 78, lastReportDate: '2025-01-15' },
  { id: 9, name: 'Укрзалізниця', sector: 'Транспорт', region: 'Київ', score: 65, lastReportDate: '2024-08-30' },
  { id: 10, name: 'ОДА Дніпропетровська', sector: 'Держуправління', region: 'Дніпропетровська обл.', score: 80, lastReportDate: '2025-02-10' },
  { id: 11, name: 'ДТЕК', sector: 'Енергетика', region: 'Дніпропетровська обл.', score: 88, lastReportDate: '2025-03-05' },
  { id: 12, name: 'ОДА Львівська', sector: 'Держуправління', region: 'Львівська обл.', score: 85, lastReportDate: '2025-04-10' },
];

const ALL_SECTORS = Array.from(new Set(mockOrgs.map(o => o.sector))).sort();
const ALL_REGIONS = Array.from(new Set(mockOrgs.map(o => o.region))).sort();

const scoreColor = (s: number) => s >= 85 ? 'success' : s >= 65 ? 'warning' : 'error';
const scoreHex = (s: number) => s >= 85 ? '#2e7d32' : s >= 65 ? '#ed6c02' : '#d32f2f';

const isOverdue = (dateStr: string) => {
  const deadline = new Date(dateStr);
  deadline.setFullYear(deadline.getFullYear() + 1);
  return deadline < new Date();
};

export default function AnalystOrganizations() {
  const [search, setSearch] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [selected, setSelected] = useState<typeof mockOrgs[0] | null>(null);

  const toggleSector = (s: string) =>
    setSelectedSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleRegion = (r: string) =>
    setSelectedRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const clearFilters = () => {
    setSelectedSectors([]);
    setSelectedRegions([]);
    setShowOverdueOnly(false);
    setSearch('');
  };

  const filtered = mockOrgs.filter(o => {
    const matchSearch = o.name.toLowerCase().includes(search.toLowerCase());
    const matchSector = selectedSectors.length === 0 || selectedSectors.includes(o.sector);
    const matchRegion = selectedRegions.length === 0 || selectedRegions.includes(o.region);
    const matchOverdue = !showOverdueOnly || isOverdue(o.lastReportDate);
    return matchSearch && matchSector && matchRegion && matchOverdue;
  });

  const activeFiltersCount = selectedSectors.length + selectedRegions.length + (showOverdueOnly ? 1 : 0);

  if (selected) {
    const overdue = isOverdue(selected.lastReportDate);
    const deadline = new Date(selected.lastReportDate);
    deadline.setFullYear(deadline.getFullYear() + 1);

    return (
      <Box>
        <Button onClick={() => setSelected(null)} sx={{ mb: 3 }}>← Назад до списку</Button>
        <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h2">{selected.name}</Typography>
                {overdue && <Chip label="Протерміновано" color="error" size="small" icon={<WarningAmberIcon />} />}
              </Box>
              <Typography variant="body2" color="text.secondary">{selected.sector} · {selected.region}</Typography>
            </Box>
            <Chip label={`${selected.score}%`} color={scoreColor(selected.score)} sx={{ ml: 'auto', fontWeight: 700, fontSize: '1rem', px: 1 }} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <AssessmentIcon sx={{ color: 'primary.main', fontSize: 32, mb: 1 }} />
              <Typography variant="h3">Останній звіт</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {new Date(selected.lastReportDate).toLocaleDateString('uk-UA')}
              </Typography>
              <Typography variant="body2" color={overdue ? 'error.main' : 'text.secondary'} sx={{ mt: 0.5 }}>
                {overdue ? `Протерміновано з ${deadline.toLocaleDateString('uk-UA')}` : `Дедлайн: ${deadline.toLocaleDateString('uk-UA')}`}
              </Typography>
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
    );
  }

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 4 }}>Організації</Typography>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

        {/* ===== Бічна панель фільтрів ===== */}
        <Paper sx={{ width: 260, flexShrink: 0, p: 3, borderRadius: 3, position: 'sticky', top: 16 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon fontSize="small" color="primary" />
              <Typography variant="h3">Фільтри</Typography>
              {activeFiltersCount > 0 && (
                <Chip label={activeFiltersCount} color="primary" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
              )}
            </Box>
            {activeFiltersCount > 0 && (
              <Button size="small" color="inherit" onClick={clearFilters} sx={{ fontSize: '0.75rem', minWidth: 0 }}>
                Скинути
              </Button>
            )}
          </Box>

          {/* Пошук */}
          <TextField
            fullWidth
            placeholder="Назва організації..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />

          {/* Фільтр: протерміновані */}
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, mb: 2, bgcolor: showOverdueOnly ? '#fff8f0' : 'transparent', borderColor: showOverdueOnly ? 'warning.main' : 'divider' }}>
            <FormControlLabel
              control={<Checkbox checked={showOverdueOnly} onChange={e => setShowOverdueOnly(e.target.checked)} color="warning" size="small" />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <WarningAmberIcon fontSize="small" sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" fontWeight="bold">Тільки протерміновані</Typography>
                </Box>
              }
              sx={{ m: 0 }}
            />
          </Paper>

          <Divider sx={{ mb: 2 }} />

          {/* Сектори */}
          <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
            Сектори
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
            {ALL_SECTORS.map(s => (
              <FormControlLabel
                key={s}
                control={<Checkbox checked={selectedSectors.includes(s)} onChange={() => toggleSector(s)} size="small" />}
                label={<Typography variant="body2">{s}</Typography>}
                sx={{ m: 0, '& .MuiFormControlLabel-label': { lineHeight: 1.4 } }}
              />
            ))}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Регіони */}
          <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
            Регіони
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {ALL_REGIONS.map(r => (
              <FormControlLabel
                key={r}
                control={<Checkbox checked={selectedRegions.includes(r)} onChange={() => toggleRegion(r)} size="small" />}
                label={<Typography variant="body2">{r}</Typography>}
                sx={{ m: 0 }}
              />
            ))}
          </Box>
        </Paper>

        {/* ===== Список організацій ===== */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Знайдено: <strong>{filtered.length}</strong> організацій
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map(org => {
              const overdue = isOverdue(org.lastReportDate);
              const deadline = new Date(org.lastReportDate);
              deadline.setFullYear(deadline.getFullYear() + 1);

              return (
                <Paper
                  key={org.id}
                  sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', transition: '0.2s', '&:hover': { boxShadow: 4 }, borderLeft: overdue ? '4px solid #d32f2f' : '4px solid transparent' }}
                  onClick={() => setSelected(org)}
                >
                  <BusinessIcon sx={{ color: overdue ? 'error.main' : 'primary.main', fontSize: 28, flexShrink: 0 }} />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body1" fontWeight="bold">{org.name}</Typography>
                      {overdue && (
                        <Tooltip title={`Дедлайн минув ${deadline.toLocaleDateString('uk-UA')}`}>
                          <Chip label="Протерміновано" color="error" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                        </Tooltip>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {org.sector} · {org.region} · Останній звіт: {new Date(org.lastReportDate).toLocaleDateString('uk-UA')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                    <Chip label={org.sector} variant="outlined" size="small" sx={{ fontSize: '0.7rem' }} />
                    <Chip label={`${org.score}%`} color={scoreColor(org.score)} size="small" sx={{ fontWeight: 700 }} />
                  </Box>
                </Paper>
              );
            })}

            {filtered.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="body1" color="text.secondary">Нічого не знайдено за обраними фільтрами.</Typography>
                <Button onClick={clearFilters} sx={{ mt: 1 }}>Скинути фільтри</Button>
              </Paper>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
