import {
  Box, Typography, Paper, Tab, Tabs, Button, TextField, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Switch, FormControlLabel
} from '@mui/material';
import { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const ROLES = ['USER', 'ANALYST', 'OBSERVER', 'FUNC_ADMIN'];
const ROLE_LABELS: Record<string, string> = {
  USER: 'Користувач', ANALYST: 'Аналітик', OBSERVER: 'Спостерігач', FUNC_ADMIN: 'Функц. адмін'
};
const ROLE_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning'> = {
  USER: 'default', ANALYST: 'primary', OBSERVER: 'success', FUNC_ADMIN: 'warning'
};

export default function AdminSubjects() {
  const [tab, setTab] = useState(0);

  // ── Users ──
  const [users, setUsers] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userDialog, setUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ email: '', first_name: '', last_name: '', role: 'USER', organization_id: '', password: '', is_active: true });

  // ── Organizations ──
  const [orgDialog, setOrgDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [orgForm, setOrgForm] = useState({ name: '' });

  // ── Sectors (mock) ──
  const [sectors, setSectors] = useState([
    { id: 1, name: 'Охорона здоров\'я', orgs: 14 },
    { id: 2, name: 'Фінанси', orgs: 23 },
    { id: 3, name: 'Транспорт', orgs: 9 },
    { id: 4, name: 'Енергетика', orgs: 18 },
    { id: 5, name: 'Освіта', orgs: 31 },
    { id: 6, name: 'Оборона', orgs: 7 },
    { id: 7, name: 'Держуправління', orgs: 45 },
  ]);
  const [sectorDialog, setSectorDialog] = useState(false);
  const [sectorForm, setSectorForm] = useState({ name: '' });
  const [editingSector, setEditingSector] = useState<any>(null);

  const fetchData = () => {
    fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(Array.isArray(d) ? d : []); setLoadingUsers(false); }).catch(() => setLoadingUsers(false));
    fetch('/api/admin/organizations').then(r => r.json()).then(d => setOrgs(Array.isArray(d) ? d : []));
  };

  useEffect(() => { fetchData(); }, []);

  // ── User actions ──
  const openUserDialog = (u?: any) => {
    setEditingUser(u || null);
    setUserForm(u ? { email: u.email, first_name: u.first_name || '', last_name: u.last_name || '', role: u.role, organization_id: u.organization_id || '', password: '', is_active: u.is_active } : { email: '', first_name: '', last_name: '', role: 'USER', organization_id: '', password: '', is_active: true });
    setUserDialog(true);
  };

  const saveUser = async () => {
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userForm) });
    setUserDialog(false);
    fetchData();
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Видалити користувача?')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    fetchData();
  };

  // ── Org actions ──
  const openOrgDialog = (o?: any) => {
    setEditingOrg(o || null);
    setOrgForm({ name: o?.name || '' });
    setOrgDialog(true);
  };

  const saveOrg = async () => {
    const method = editingOrg ? 'PUT' : 'POST';
    const url = editingOrg ? `/api/admin/organizations/${editingOrg.id}` : '/api/admin/organizations';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orgForm) });
    setOrgDialog(false);
    fetchData();
  };

  const deleteOrg = async (id: string) => {
    if (!confirm('Видалити організацію?')) return;
    await fetch(`/api/admin/organizations/${id}`, { method: 'DELETE' });
    fetchData();
  };

  // ── Sector actions ──
  const saveSector = () => {
    if (editingSector) setSectors(s => s.map(x => x.id === editingSector.id ? { ...x, name: sectorForm.name } : x));
    else setSectors(s => [...s, { id: Date.now(), name: sectorForm.name, orgs: 0 }]);
    setSectorDialog(false);
  };

  const orgName = (id: string) => orgs.find(o => o.id === id)?.name || '—';

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 4 }}>Управління суб'єктами</Typography>

      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab label={`Користувачі (${users.length})`} sx={{ fontWeight: 600, py: 2 }} />
          <Tab label={`Організації (${orgs.length})`} sx={{ fontWeight: 600, py: 2 }} />
          <Tab label={`Сектори (${sectors.length})`} sx={{ fontWeight: 600, py: 2 }} />
        </Tabs>
      </Paper>

      {/* ── USERS TAB ── */}
      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => openUserDialog()}>Додати користувача</Button>
          </Box>
          {loadingUsers ? <CircularProgress /> : (
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Ім'я</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Роль</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Організація</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Статус</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Дії</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.id} hover>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}</TableCell>
                        <TableCell><Chip label={ROLE_LABELS[u.role] || u.role} color={ROLE_COLORS[u.role] || 'default'} size="small" /></TableCell>
                        <TableCell>{u.organization_id ? orgName(u.organization_id) : '—'}</TableCell>
                        <TableCell><Chip label={u.is_active ? 'Активний' : 'Неактивний'} color={u.is_active ? 'success' : 'default'} size="small" /></TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openUserDialog(u)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => deleteUser(u.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      )}

      {/* ── ORGANIZATIONS TAB ── */}
      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => openOrgDialog()}>Додати організацію</Button>
          </Box>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Назва організації</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Дії</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orgs.map(o => (
                    <TableRow key={o.id} hover>
                      <TableCell>{o.name}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openOrgDialog(o)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => deleteOrg(o.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* ── SECTORS TAB ── */}
      {tab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingSector(null); setSectorForm({ name: '' }); setSectorDialog(true); }}>Додати сектор</Button>
          </Box>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Назва сектору</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Організацій</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Дії</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sectors.map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.orgs}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => { setEditingSector(s); setSectorForm({ name: s.name }); setSectorDialog(true); }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => setSectors(prev => prev.filter(x => x.id !== s.id))}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* ── USER DIALOG ── */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingUser ? 'Редагувати користувача' : 'Новий користувач'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} fullWidth disabled={!!editingUser} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Ім'я" value={userForm.first_name} onChange={e => setUserForm({ ...userForm, first_name: e.target.value })} fullWidth />
            <TextField label="Прізвище" value={userForm.last_name} onChange={e => setUserForm({ ...userForm, last_name: e.target.value })} fullWidth />
          </Box>
          <FormControl fullWidth>
            <InputLabel>Роль</InputLabel>
            <Select value={userForm.role} label="Роль" onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
              {ROLES.map(r => <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Організація</InputLabel>
            <Select value={userForm.organization_id} label="Організація" onChange={e => setUserForm({ ...userForm, organization_id: e.target.value })}>
              <MenuItem value="">— Не вказано —</MenuItem>
              {orgs.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label={editingUser ? 'Новий пароль (залиште порожнім щоб не змінювати)' : 'Пароль'} type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} fullWidth />
          <FormControlLabel control={<Switch checked={userForm.is_active} onChange={e => setUserForm({ ...userForm, is_active: e.target.checked })} />} label="Активний" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setUserDialog(false)} color="inherit">Скасувати</Button>
          <Button onClick={saveUser} variant="contained">Зберегти</Button>
        </DialogActions>
      </Dialog>

      {/* ── ORG DIALOG ── */}
      <Dialog open={orgDialog} onClose={() => setOrgDialog(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingOrg ? 'Редагувати організацію' : 'Нова організація'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField label="Назва організації" value={orgForm.name} onChange={e => setOrgForm({ name: e.target.value })} fullWidth autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOrgDialog(false)} color="inherit">Скасувати</Button>
          <Button onClick={saveOrg} variant="contained">Зберегти</Button>
        </DialogActions>
      </Dialog>

      {/* ── SECTOR DIALOG ── */}
      <Dialog open={sectorDialog} onClose={() => setSectorDialog(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingSector ? 'Редагувати сектор' : 'Новий сектор'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField label="Назва сектору" value={sectorForm.name} onChange={e => setSectorForm({ name: e.target.value })} fullWidth autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setSectorDialog(false)} color="inherit">Скасувати</Button>
          <Button onClick={saveSector} variant="contained">Зберегти</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
