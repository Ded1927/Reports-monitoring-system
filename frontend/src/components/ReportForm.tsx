import { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, RadioGroup, FormControlLabel, Radio, 
  Button, Accordion, AccordionSummary, AccordionDetails, Snackbar, Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import type { ReportTemplate } from '../types';

interface ReportFormProps {
  template: ReportTemplate;
  initialAnswers?: Record<string, string>;
  initialDraftId?: string | null;
}

export default function ReportForm({ template, initialAnswers = {}, initialDraftId = null }: ReportFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [expandedCategory, setExpandedCategory] = useState<string | false>(false);
  const [autoSaveMsg, setAutoSaveMsg] = useState<string | null>(null);

  const answersRef = useRef(answers);
  const filesRef = useRef(files);
  const draftIdRef = useRef(draftId);
  const lastSavedStateRef = useRef("");

  useEffect(() => {
    answersRef.current = answers;
    filesRef.current = files;
    draftIdRef.current = draftId;
  }, [answers, files, draftId]);

  const totalControls = template.parts.reduce((sum, part) => 
    sum + part.categories.reduce((cSum, cat) => cSum + cat.controls.length, 0), 0
  );

  const answeredCount = Object.keys(answers).length;
  const isAllAnswered = answeredCount === totalControls;

  const handleAnswerChange = (controlId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [controlId]: optionId }));
  };

  const handleFileChange = (controlId: string, file: File | null) => {
    if (file) {
      setFiles(prev => ({ ...prev, [controlId]: file }));
    }
  };

  const handleAccordionChange = (categoryId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedCategory(isExpanded ? categoryId : false);
  };

  const getCategoryBgColor = (categoryId: string) => {
    let category = null;
    for (const part of template.parts) {
      const found = part.categories.find(c => c.id === categoryId);
      if (found) {
        category = found;
        break;
      }
    }
    
    if (!category || category.controls.length === 0) return '#fafafa';

    let catAnsweredCount = 0;
    category.controls.forEach(control => {
      if (answers[control.id]) catAnsweredCount++;
    });

    if (catAnsweredCount === 0) return '#fafafa'; 
    if (catAnsweredCount === category.controls.length) return '#e8f5e9'; 
    return '#fff3e0'; 
  };

  const handleClear = () => {
    if (window.confirm("Ви впевнені, що хочете видалити всі внесені дані? Це незворотна дія.")) {
      setAnswers({});
      setFiles({});
      setDraftId(null);
      setExpandedCategory(false);
      lastSavedStateRef.current = "";
    }
  };

  const performSave = async (status: 'DRAFT' | 'SUBMITTED', isAutoSave = false) => {
    const currentAnswers = answersRef.current;
    const currentFiles = filesRef.current;
    const currentDraftId = draftIdRef.current;

    const currentAnsweredCount = Object.keys(currentAnswers).length;

    if (status === 'SUBMITTED' && currentAnsweredCount < totalControls) {
      if (!isAutoSave) {
        alert(`Щоб подати звіт, необхідно дати відповідь на всі питання!\nЗараз відповідей: ${currentAnsweredCount} з ${totalControls}.`);
      }
      return;
    }

    const answerList = Object.entries(currentAnswers).map(([controlId, optionId]) => ({
      control_id: controlId,
      selected_option_id: optionId
    }));

    const payload: any = {
      template_id: template.id,
      status: status,
      answers: answerList
    };

    if (currentDraftId) {
      payload.report_id = currentDraftId;
    }

    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));

    Object.entries(currentFiles).forEach(([controlId, file]) => {
      formData.append(`file_${controlId}`, file);
    });

    try {
      const res = await fetch('/api/reports/submit', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error("Помилка сервера");
      
      const data = await res.json();
      
      if (data.report_id) {
        setDraftId(data.report_id);
      }

      if (isAutoSave) {
        setAutoSaveMsg("Чернетку автозбережено");
      } else {
        alert(`Звіт успішно ${status === 'DRAFT' ? 'збережено як чернетку' : 'подано'}!`);
      }
    } catch (e) {
      console.error(e);
      if (!isAutoSave) {
        alert("Сталася помилка при збереженні звіту.");
      }
    }
  };

  // Автозбереження кожні 10 секунд
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentStateStr = JSON.stringify(answersRef.current);
      if (currentStateStr !== lastSavedStateRef.current && Object.keys(answersRef.current).length > 0) {
        performSave('DRAFT', true);
        lastSavedStateRef.current = currentStateStr;
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 4, 
        p: 2, 
        bgcolor: '#f5f5f5', 
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 16,
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <Button 
          variant="outlined" 
          color="error" 
          startIcon={<DeleteIcon />}
          onClick={handleClear}
          sx={{ borderRadius: 2 }}
        >
          Видалити
        </Button>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>

          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<SaveIcon />}
            onClick={() => {
              lastSavedStateRef.current = JSON.stringify(answersRef.current);
              performSave('DRAFT', false);
            }}
            sx={{ borderRadius: 2 }}
          >
            Зберегти чернетку
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SendIcon />}
            onClick={() => performSave('SUBMITTED', false)}
            disabled={!isAllAnswered}
            sx={{ borderRadius: 2 }}
          >
            Подати звіт
          </Button>
        </Box>
      </Box>

      {[...template.parts].sort((a, b) => a.order_num - b.order_num).map((part) => (
        <Box key={part.id} sx={{ mb: 6 }}>
          <Typography variant="h2" sx={{ mb: 3, pb: 1, borderBottom: '2px solid #000' }}>
            Частина {part.order_num}: {part.name}
          </Typography>

          {[...part.categories].sort((a, b) => a.order_num - b.order_num).map((category) => (
            <Accordion 
              key={category.id} 
              expanded={expandedCategory === category.id} 
              onChange={handleAccordionChange(category.id)}
              sx={{ mb: 2, '&:before': { display: 'none' }, boxShadow: 1, borderRadius: '8px !important' }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />} 
                sx={{ 
                  bgcolor: getCategoryBgColor(category.id), 
                  borderBottom: '1px solid #eee', 
                  borderRadius: expandedCategory === category.id ? '8px 8px 0 0' : '8px',
                  transition: 'background-color 0.3s ease'
                }}
              >
                <Typography variant="h3">{category.name}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {[...category.controls].sort((a, b) => a.order_num - b.order_num).map((control, idx) => (
                  <Box key={control.id} sx={{ p: 3, bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                      {control.code && <strong style={{ marginRight: '8px' }}>[{control.code}]</strong>}
                      {control.question_text}
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </Typography>
                    
                    <RadioGroup 
                      value={answers[control.id] || ''}
                      onChange={(e) => handleAnswerChange(control.id, e.target.value)}
                    >
                      {[...control.options].sort((a, b) => a.order_num - b.order_num).map((option) => (
                        <FormControlLabel 
                          key={option.id} 
                          value={option.id} 
                          control={<Radio color="primary" />} 
                          label={option.label} 
                          sx={{ mb: 1, '& .MuiFormControlLabel-label': { fontSize: '0.95rem' } }}
                        />
                      ))}
                    </RadioGroup>

                    <Box sx={{ mt: 2 }}>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        {files[control.id] ? files[control.id].name : "Додати PDF документ (необов'язково)"}
                        <input
                          type="file"
                          hidden
                          accept="application/pdf"
                          onChange={(e) => handleFileChange(control.id, e.target.files ? e.target.files[0] : null)}
                        />
                      </Button>
                    </Box>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ))}

      <Snackbar
        open={!!autoSaveMsg}
        autoHideDuration={3000}
        onClose={() => setAutoSaveMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setAutoSaveMsg(null)} severity="success" sx={{ width: '100%' }}>
          {autoSaveMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
