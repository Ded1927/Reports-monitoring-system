import { Box, Typography, Paper, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SaveIcon from '@mui/icons-material/Save';

export default function Profile() {
  const { user } = useAuth();
  
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password && password !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }
    
    setSaving(true);
    
    try {
      const payload: any = {
        first_name: firstName,
        last_name: lastName
      };
      
      if (password) {
        payload.password = password;
      }
      
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Помилка при збереженні профілю');
      
      setSuccess('Профіль успішно оновлено! Якщо ви змінили ім\'я, оновіть сторінку, щоб побачити зміни.');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Сталася помилка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box maxWidth="sm" mx="auto">
      <Typography variant="h1" sx={{ mb: 4 }}>Профіль користувача</Typography>
      
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
        
        <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField 
            label="Email (не редагується)" 
            value={user?.email || ''} 
            disabled 
            fullWidth 
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              label="Ім'я" 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
              fullWidth 
              required
            />
            <TextField 
              label="Прізвище" 
              value={lastName} 
              onChange={e => setLastName(e.target.value)} 
              fullWidth 
              required
            />
          </Box>
          
          <Typography variant="h3" sx={{ mt: 2 }}>Зміна пароля</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Залиште поля порожніми, якщо не хочете змінювати пароль.
          </Typography>
          
          <TextField 
            label="Новий пароль" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            fullWidth 
          />
          <TextField 
            label="Підтвердіть новий пароль" 
            type="password" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            fullWidth 
          />
          
          <Button 
            type="submit" 
            variant="contained" 
            size="large" 
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={saving}
            sx={{ mt: 2 }}
          >
            Зберегти зміни
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
