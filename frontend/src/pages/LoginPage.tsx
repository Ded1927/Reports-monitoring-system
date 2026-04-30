import { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!res.ok) {
        let errMessage = 'Помилка авторизації';
        try {
          const errData = await res.json();
          errMessage = errData.detail || errMessage;
        } catch (e) {
          errMessage = `Сервер недоступний (${res.status})`;
        }
        throw new Error(errMessage);
      }

      await checkAuth(); // Оновлюємо стан юзера
      navigate('/'); // Перехід на головну сторінку
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: '#fafafa',
      p: 2
    }}>
      <Paper elevation={1} sx={{ p: 5, maxWidth: 400, width: '100%', borderRadius: 2 }}>
        <Typography variant="h2" align="center" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
          Вхід у систему
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Електронна пошта"
            type="email"
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 4 }}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ py: 1.5 }}
          >
            {loading ? 'Зачекайте...' : 'Увійти'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
