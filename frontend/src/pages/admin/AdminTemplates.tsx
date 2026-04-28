import {
  Box, Typography, Paper, CircularProgress, Accordion, AccordionSummary,
  AccordionDetails, Chip, IconButton, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField
} from '@mui/material';
import { useState, useEffect } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<{ type: 'template' | 'part' | 'category'; item: any } | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetch('/api/admin/templates')
      .then(r => r.json())
      .then(data => { setTemplates(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openEdit = (type: 'template' | 'part' | 'category', item: any) => {
    setEditTarget({ type, item });
    setEditName(item.name);
    setEditDialog(true);
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 4 }}>Шаблони звітів</Typography>

      {templates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">Шаблони не знайдено.</Typography>
        </Paper>
      ) : (
        templates.map(tmpl => (
          <Paper key={tmpl.id} sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
            {/* Template header */}
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h3">{tmpl.name}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip label={tmpl.type === 'SELF_ASSESSMENT' ? 'Самооцінювання' : 'Зовнішнє'} size="small" color="primary" />
                  <Chip label={`v${tmpl.version}`} size="small" variant="outlined" />
                  <Chip label={tmpl.is_active ? 'Активний' : 'Архів'} size="small" color={tmpl.is_active ? 'success' : 'default'} />
                </Box>
              </Box>
              <IconButton size="small" onClick={() => openEdit('template', tmpl)}><EditIcon /></IconButton>
            </Box>

            {/* Parts */}
            <Box sx={{ p: 2 }}>
              {tmpl.parts.map((part: any) => (
                <Accordion key={part.id} disableGutters elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: '8px !important', mb: 1, '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 1 }}>
                      <Typography variant="body1" fontWeight="bold" sx={{ flexGrow: 1 }}>
                        {part.order_num}. {part.name}
                      </Typography>
                      <Chip label={`${part.categories?.length || 0} категорій`} size="small" variant="outlined" />
                      <IconButton size="small" onClick={e => { e.stopPropagation(); openEdit('part', part); }}><EditIcon fontSize="small" /></IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ bgcolor: '#fafafa', pt: 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {part.categories?.map((cat: any) => (
                        <Box key={cat.id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid #eeeeee' }}>
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>{cat.name}</Typography>
                          <Chip label={`${cat.controls_count} питань`} size="small" sx={{ mr: 1 }} />
                          <IconButton size="small" onClick={() => openEdit('category', cat)}><EditIcon fontSize="small" /></IconButton>
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Paper>
        ))
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Редагувати {editTarget?.type === 'template' ? 'шаблон' : editTarget?.type === 'part' ? 'розділ' : 'категорію'}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField label="Назва" value={editName} onChange={e => setEditName(e.target.value)} fullWidth autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditDialog(false)} color="inherit">Скасувати</Button>
          <Button variant="contained" onClick={() => setEditDialog(false)}>Зберегти</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
