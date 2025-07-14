import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import HostCard from '../components/HostCard';
import { getHostDetail } from '../api';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';

const HostDetailPage = () => {
  const { id } = useParams();
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Состояние для работы с кодами
  const [userCodes, setUserCodes] = useState([]);
  const [selectedCodeId, setSelectedCodeId] = useState('');
  const [codeData, setCodeData] = useState({
    variables: {},
    output: null,
    error: null
  });
  
  const [executionState, setExecutionState] = useState({
    loading: false,
    success: null,
    message: ''
  });

  // Загружаем данные хоста и коды пользователя
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Загрузка данных хоста
        const hostData = await getHostDetail(id);
        setHost(hostData);
        
        // Загрузка кодов пользователя
        const response = await axios.get('/api/messagecode/');
        setUserCodes(response.data);
        
        // Если есть коды, выбираем первый по умолчанию
        if (response.data.length > 0) {
          setSelectedCodeId(response.data[0].id);
        }
      } catch (err) {
        setError('Ошибка загрузки данных');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Загружаем данные выбранного кода
  useEffect(() => {
    if (!selectedCodeId) return;
    
    const fetchCodeData = async () => {
      try {
        const response = await axios.get(`/api/messagecode/${selectedCodeId}/`);
        setCodeData({
          variables: response.data.variables || {},
          output: response.data.output,
          error: response.data.error
        });
      } catch (err) {
        console.error('Ошибка загрузки кода:', err);
      }
    };
    
    fetchCodeData();
  }, [selectedCodeId]);

  const handleVariablesChange = (e) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setCodeData(prev => ({
        ...prev,
        variables: parsed
      }));
    } catch {
      setCodeData(prev => ({
        ...prev,
        variables: e.target.value
      }));
    }
  };

  const handleSaveVariables = async () => {
    if (!selectedCodeId) return;
    
    try {
      setExecutionState({ loading: true, success: null, message: '' });
      await axios.patch(
        `/api/messagecode/${selectedCodeId}/update-variables/`,
        { variables: codeData.variables }
      );
      setExecutionState({ 
        loading: false, 
        success: true, 
        message: 'Variables успешно сохранены' 
      });
    } catch (err) {
      console.error(err);
      setExecutionState({ 
        loading: false, 
        success: false, 
        message: err.response?.data?.error || 'Ошибка сохранения' 
      });
    }
  };

  const handleExecuteCode = async () => {
    if (!selectedCodeId) return;
    
    try {
      setExecutionState({ loading: true, success: null, message: '' });
      const response = await axios.post(
        `/api/messagecode/${selectedCodeId}/execute/`
      );
      setCodeData(prev => ({
        ...prev,
        output: response.data.output,
        error: null
      }));
      setExecutionState({ 
        loading: false, 
        success: true, 
        message: 'Код выполнен успешно' 
      });
    } catch (err) {
      console.error(err);
      setCodeData(prev => ({
        ...prev,
        output: null,
        error: err.response?.data?.execution || 'Ошибка выполнения'
      }));
      setExecutionState({ 
        loading: false, 
        success: false, 
        message: err.response?.data?.execution || 'Ошибка выполнения' 
      });
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!host) return <Alert severity="warning">Хост не найден</Alert>;

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 3 }}>
      {/* Карточка хоста */}
      <Box sx={{ flex: '0 0 430px' }}>
        <HostCard host={host} />
      </Box>

      {/* Блок работы с кодом */}
      <Paper sx={{ flex: 1, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Управление кодом сообщений
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Выбор кода */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Выберите код</InputLabel>
          <Select
            value={selectedCodeId}
            onChange={(e) => setSelectedCodeId(e.target.value)}
            label="Выберите код"
          >
            {userCodes.map(code => (
              <MenuItem key={code.id} value={code.id}>
                {code.name} (ID: {code.id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Поле для редактирования variables */}
        <Typography variant="subtitle1" gutterBottom>
          Variables (JSON)
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={4}
          maxRows={8}
          value={JSON.stringify(codeData.variables, null, 2)}
          onChange={handleVariablesChange}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveVariables}
            disabled={executionState.loading || !selectedCodeId}
          >
            Сохранить Variables
          </Button>
          
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrowIcon />}
            onClick={handleExecuteCode}
            disabled={executionState.loading || !selectedCodeId}
          >
            Выполнить код
          </Button>
        </Box>

        {/* Статус выполнения */}
        {executionState.message && (
          <Alert 
            severity={executionState.success ? "success" : "error"} 
            sx={{ mb: 3 }}
          >
            {executionState.message}
          </Alert>
        )}

        {/* Вывод результата */}
        {codeData.output && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Результат выполнения:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <pre style={{ margin: 0 }}>{codeData.output}</pre>
            </Paper>
          </>
        )}

        {/* Ошибки выполнения */}
        {codeData.error && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
              Ошибки:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.light' }}>
              <pre style={{ margin: 0, color: 'error.main' }}>{codeData.error}</pre>
            </Paper>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default HostDetailPage;