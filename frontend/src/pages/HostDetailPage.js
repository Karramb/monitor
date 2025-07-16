import React from 'react';
import { useParams } from 'react-router-dom';
import HostCard from '../components/HostCard';
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
  FormControl,
  Tab,
  Tabs
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import useHostCode from '../hooks/useHostCode';

const HostDetailPage = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = React.useState(0);

  const {
    host,
    loading,
    error,
    codesLoading,
    
    // Input code
    inputCodes,
    selectedInputCodeId,
    setSelectedInputCodeId,
    inputCodeData,
    inputVariablesText,
    handleInputVariablesChange,
    handleSaveInputVariables,
    handleExecuteInputCode,
    
    // Output code
    outputCodes,
    selectedOutputCodeId,
    setSelectedOutputCodeId,
    outputCodeData,
    outputVariablesText,
    handleOutputVariablesChange,
    handleSaveOutputVariables,
    handleExecuteOutputCode,
    
    executionState
  } = useHostCode(id);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!host) return <Alert severity="warning">Хост не найден</Alert>;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 3 }}>
      <Box sx={{ flex: '0 0 430px' }}>
        <HostCard host={host} />
      </Box>

      <Paper sx={{ flex: 1, p: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Input-код" />
          <Tab label="Output-код (10messages)" />
        </Tabs>

        {activeTab === 0 ? (
          <>
            <Typography variant="h6" gutterBottom>
              Управление input-кодом сообщений
            </Typography>

            <Divider sx={{ my: 2 }} />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Выберите input-код</InputLabel>
              <Select
                value={selectedInputCodeId}
                onChange={(e) => setSelectedInputCodeId(e.target.value)}
                label="Выберите input-код"
                disabled={codesLoading || inputCodes.length === 0}
              >
                {codesLoading ? (
                  <MenuItem disabled>Загрузка кодов...</MenuItem>
                ) : inputCodes.length === 0 ? (
                  <MenuItem disabled>Нет input-кодов</MenuItem>
                ) : (
                  inputCodes.map(code => (
                    <MenuItem key={code.id} value={code.id}>
                      {code.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <Typography variant="subtitle1" gutterBottom>Переменные (JSON):</Typography>
            <TextField
              fullWidth
              multiline
              minRows={4}
              maxRows={8}
              value={inputVariablesText}
              onChange={(e) => handleInputVariablesChange(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveInputVariables}
                disabled={executionState.loading && executionState.type === 'input'}
              >
                Сохранить переменные
              </Button>
              <Button
                variant="outlined"
                startIcon={<PlayArrowIcon />}
                onClick={handleExecuteInputCode}
                disabled={executionState.loading && executionState.type === 'input'}
              >
                Выполнить код
              </Button>
              {executionState.loading && executionState.type === 'input' && <CircularProgress size={24} />}
            </Box>

            {executionState.type === 'input' && executionState.message && (
              <Alert severity={executionState.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                {executionState.message}
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1">Вывод:</Typography>
            <Paper variant="outlined" sx={{ p: 2, minHeight: 120, whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9' }}>
              {inputCodeData.output || 'Нет вывода'}
            </Paper>

            {inputCodeData.error && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" color="error">Ошибка:</Typography>
                <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap', backgroundColor: '#ffe6e6' }}>
                  {inputCodeData.error}
                </Paper>
              </>
            )}
          </>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Управление output-кодом (10messages)
            </Typography>

            <Divider sx={{ my: 2 }} />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Выберите output-код</InputLabel>
              <Select
                value={selectedOutputCodeId}
                onChange={(e) => setSelectedOutputCodeId(e.target.value)}
                label="Выберите output-код"
                disabled={codesLoading || outputCodes.length === 0}
              >
                {codesLoading ? (
                  <MenuItem disabled>Загрузка кодов...</MenuItem>
                ) : outputCodes.length === 0 ? (
                  <MenuItem disabled>Нет output-кодов</MenuItem>
                ) : (
                  outputCodes.map(code => (
                    <MenuItem key={code.id} value={code.id}>
                      {code.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <Typography variant="subtitle1" gutterBottom>Переменные (JSON):</Typography>
            <TextField
              fullWidth
              multiline
              minRows={4}
              maxRows={8}
              value={outputVariablesText}
              onChange={(e) => handleOutputVariablesChange(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveOutputVariables}
                disabled={executionState.loading && executionState.type === 'output'}
              >
                Сохранить переменные
              </Button>
              <Button
                variant="outlined"
                startIcon={<PlayArrowIcon />}
                onClick={handleExecuteOutputCode}
                disabled={executionState.loading && executionState.type === 'output'}
              >
                Выполнить код
              </Button>
              {executionState.loading && executionState.type === 'output' && <CircularProgress size={24} />}
            </Box>

            {executionState.type === 'output' && executionState.message && (
              <Alert severity={executionState.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                {executionState.message}
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1">Вывод:</Typography>
            <Paper variant="outlined" sx={{ p: 2, minHeight: 120, whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9' }}>
              {outputCodeData.output || 'Нет вывода'}
            </Paper>

            {outputCodeData.error && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" color="error">Ошибка:</Typography>
                <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap', backgroundColor: '#ffe6e6' }}>
                  {outputCodeData.error}
                </Paper>
              </>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default HostDetailPage;