import { Box, Typography, Paper, Button, TextField, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BookIcon from '@mui/icons-material/Book';

const initialRecs = [
  { id: 1, category: 'Управління доступом', title: 'Впровадити багатофакторну автентифікацію', text: 'Рекомендується впровадити MFA для всіх адміністративних облікових записів. Мінімум — TOTP або апаратні ключі.', severity: 'high' },
  { id: 2, category: 'Мережева безпека', title: 'Сегментація мережі', text: 'Розділити корпоративну мережу на зони: DMZ, внутрішня, критична інфраструктура. Між зонами встановити міжмережеві екрани.', severity: 'medium' },
  { id: 3, category: 'Реагування на інциденти', title: 'Розробити план реагування на інциденти', text: 'Затвердити і регулярно тестувати IRP (Incident Response Plan). Включити контакти CERT-UA та внутрішніх відповідальних.', severity: 'high' },
  { id: 4, category: 'Резервне копіювання', title: 'Стратегія резервного копіювання 3-2-1', text: 'Три копії даних, два різних носії, одна копія поза межами приміщення. Перевіряти відновлення щомісяця.', severity: 'low' },
];

const severityMap: Record<string, { label: string; color: 'error' | 'warning' | 'success' }> = {
  high: { label: 'Критична', color: 'error' },
  medium: { label: 'Середня', color: 'warning' },
  low: { label: 'Низька', color: 'success' },
};

export default function AnalystRecommendations() {
  const [recs, setRecs] = useState(initialRecs);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<typeof initialRecs[0] | null>(null);
  const [form, setForm] = useState({ category: '', title: '', text: '', severity: 'medium' });

  const handleOpen = (rec?: typeof initialRecs[0]) => {
    if (rec) { setEditing(rec); setForm({ category: rec.category, title: rec.title, text: rec.text, severity: rec.severity }); }
    else { setEditing(null); setForm({ category: '', title: '', text: '', severity: 'medium' }); }
    setOpen(true);
  };

  const handleSave = () => {
    if (editing) {
      setRecs(recs.map(r => r.id === editing.id ? { ...r, ...form } : r));
    } else {
      setRecs([...recs, { id: Date.now(), ...form }]);
    }
    setOpen(false);
  };

  const handleDelete = (id: number) => setRecs(recs.filter(r => r.id !== id));

  const categories = Array.from(new Set(recs.map(r => r.category)));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h1">Рекомендації</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Додати рекомендацію
        </Button>
      </Box>

      {categories.map(cat => (
        <Box key={cat} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <BookIcon color="primary" />
            <Typography variant="h3">{cat}</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recs.filter(r => r.category === cat).map(rec => {
              const sev = severityMap[rec.severity] || { label: rec.severity, color: 'default' as const };
              return (
                <Paper key={rec.id} sx={{ p: 3, borderRadius: 2, borderLeft: `4px solid ${rec.severity === 'high' ? '#d32f2f' : rec.severity === 'medium' ? '#ed6c02' : '#2e7d32'}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h3">{rec.title}</Typography>
                        <Chip label={sev.label} color={sev.color} size="small" />
                      </Box>
                      <Typography variant="body1" color="text.secondary">{rec.text}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                      <IconButton size="small" onClick={() => handleOpen(rec)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(rec.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Box>
      ))}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Редагувати рекомендацію' : 'Нова рекомендація'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Категорія" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} fullWidth />
          <TextField label="Назва" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} fullWidth />
          <TextField label="Опис" value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} fullWidth multiline rows={3} />
          <TextField label="Критичність" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} fullWidth select SelectProps={{ native: true }}>
            <option value="high">Критична</option>
            <option value="medium">Середня</option>
            <option value="low">Низька</option>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Скасувати</Button>
          <Button onClick={handleSave} variant="contained">Зберегти</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
