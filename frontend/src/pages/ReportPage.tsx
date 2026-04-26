import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReportForm from '../components/ReportForm';
import type { ReportTemplate } from '../types';

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [initialAnswers, setInitialAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load active template structure
        const tplRes = await fetch('/api/templates/active');
        if (!tplRes.ok) throw new Error("Не вдалося завантажити шаблон");
        const tplData = await tplRes.json();
        setTemplate(tplData);

        // If editing existing report, load its answers
        if (id && id !== 'new') {
          const repRes = await fetch(`/api/reports/${id}`);
          if (!repRes.ok) throw new Error("Не вдалося завантажити звіт");
          const repData = await repRes.json();
          setInitialAnswers(repData.answers || {});
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!template) return <Alert severity="error">Шаблон не знайдено</Alert>;

  return (
    <Box>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
      >
        Повернутися до кабінету
      </Button>
      <ReportForm 
        template={template} 
        initialAnswers={initialAnswers} 
        initialDraftId={id === 'new' ? null : id}
      />
    </Box>
  );
}
