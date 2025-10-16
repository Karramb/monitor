import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button,
  Paper,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Collapse,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

function IdentCheckPage() {
  const [ident, setIdent] = useState('');
  const [protocol, setProtocol] = useState('flespi');
  const [timeRange, setTimeRange] = useState('1h');
  const [customTimeRange, setCustomTimeRange] = useState({
    start: '',
    end: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedMongo, setExpandedMongo] = useState(false);
  const [expandedPostgres, setExpandedPostgres] = useState(false);
  const [expandedRedis, setExpandedRedis] = useState(false);

  const protocols = [
    { value: 'flespi', label: 'Flespi' },
    { value: 'wialon-ips', label: 'Wialon IPS' },
    { value: 'navtelecom', label: 'Navtelecom' },
    { value: 'teltonika', label: 'Teltonika' },
    { value: 'neomatica-adm', label: 'Neomatica ADM' }
  ];

  const timeRanges = [
    { value: '5m', label: 'Последние 5 минут' },
    { value: '15m', label: 'Последние 15 минут' },
    { value: '30m', label: 'Последние 30 минут' },
    { value: '1h', label: 'Последний час' },
    { value: '6h', label: 'Последние 6 часов' },
    { value: '12h', label: 'Последние 12 часов' },
    { value: '1d', label: 'Последние сутки' },
    { value: '2d', label: 'Последние 2 суток' },
    { value: '1w', label: 'Последняя неделя' },
    { value: 'custom', label: 'Произвольное время' }
  ];

  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  useEffect(() => {
    if (timeRange === 'custom') {
      setCustomTimeRange(prev => {
        if (!prev.start && !prev.end) {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return {
            start: formatDateTimeLocal(today),
            end: formatDateTimeLocal(now)
          };
        }
        return prev;
      });
    }
  }, [timeRange]);

  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const setTimeToMidnight = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    date.setHours(0, 0, 0, 0);
    return formatDateTimeLocal(date);
  };

  const handleCheck = async () => {
    if (!ident.trim()) {
      setResult({ error: 'Введите ident для проверки' });
      return;
    }

    if (timeRange === 'custom' && (!customTimeRange.start || !customTimeRange.end)) {
      setResult({ error: 'Укажите начало и конец временного периода' });
      return;
    }

    setLoading(true);
    setExpandedMongo(false);
    setExpandedPostgres(false);
    setExpandedRedis(false);
    
    const csrftoken = getCookie('csrftoken');
    
    try {
      const response = await fetch('/api/ident-check/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'include',
        body: JSON.stringify({ 
          ident, 
          protocol,
          time_range: timeRange,
          custom_start: timeRange === 'custom' ? customTimeRange.start : null,
          custom_end: timeRange === 'custom' ? customTimeRange.end : null
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setResult({ error: data.error || 'Ошибка при проверке' });
      }
    } catch (error) {
      setResult({ error: 'Ошибка соединения с сервером' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleCheck();
    }
  };

  const renderDataSection = (title, data, expanded, setExpanded, color = 'secondary') => {
    if (!data || data.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Данные не найдены
        </Alert>
      );
    }
  
    return (
      <Box sx={{ mt: 2 }}>
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 1,
            borderLeft: '4px solid',
            borderColor: `${color}.main`
          }}
        >
          <Typography variant="body1" gutterBottom>
            <strong>Дата последнего сообщения:</strong>{' '}
            {data[0].timestamp_readable || data[0].created_at || 'Не указана'}
          </Typography>
          
          <Button
            onClick={() => setExpanded(!expanded)}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ mt: 1 }}
            variant="outlined"
            size="small"
          >
            {expanded ? 'Скрыть детали' : 'Подробнее'}
          </Button>
  
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Полное сообщение:
              </Typography>
              <pre style={{ 
                overflow: 'auto', 
                fontSize: '12px',
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '4px',
                maxHeight: '400px'
              }}>
                {JSON.stringify(data[0].data, null, 2)}
              </pre>
            </Box>
          </Collapse>
        </Box>
      </Box>
    );
  };
  

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Проверка по ident
        </Typography>

        <Grid container spacing={2} sx={{ mt: 3, mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Введите ident"
              variant="outlined"
              fullWidth
              value={ident}
              onChange={(e) => setIdent(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Протокол</InputLabel>
              <Select
                value={protocol}
                label="Протокол"
                onChange={(e) => setProtocol(e.target.value)}
                disabled={loading}
              >
                {protocols.map((proto) => (
                  <MenuItem key={proto.value} value={proto.value}>
                    {proto.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Период</InputLabel>
              <Select
                value={timeRange}
                label="Период"
                onChange={(e) => setTimeRange(e.target.value)}
                disabled={loading}
              >
                {timeRanges.map((range) => (
                  <MenuItem key={range.value} value={range.value}>
                    {range.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCheck}
              disabled={loading}
              fullWidth
              sx={{ height: '56px' }}
            >
              {loading ? 'Проверка...' : 'Проверить'}
            </Button>
          </Grid>
        </Grid>

        {timeRange === 'custom' && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Начало периода"
                type="datetime-local"
                fullWidth
                value={customTimeRange.start}
                onChange={(e) => setCustomTimeRange({
                  ...customTimeRange,
                  start: e.target.value
                })}
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <Button 
                size="small" 
                onClick={() => setCustomTimeRange({
                  ...customTimeRange,
                  start: setTimeToMidnight(customTimeRange.start)
                })}
                sx={{ mt: 1 }}
              >
                Установить 00:00
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Конец периода"
                type="datetime-local"
                fullWidth
                value={customTimeRange.end}
                onChange={(e) => setCustomTimeRange({
                  ...customTimeRange,
                  end: e.target.value
                })}
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <Button 
                size="small" 
                onClick={() => setCustomTimeRange({
                  ...customTimeRange,
                  end: setTimeToMidnight(customTimeRange.end)
                })}
                sx={{ mt: 1 }}
              >
                Установить 00:00
              </Button>
            </Grid>
          </Grid>
        )}

        {result && (
          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            {result.error ? (
              <Alert severity="error">{result.error}</Alert>
            ) : (
              <Box>
                {/* Логи из Протокола */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Протокол: {protocols.find(p => p.value === result.protocol)?.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Период: {timeRanges.find(r => r.value === result.time_range)?.label}
                    </Typography>
                    </Box>
                  {result.logs && result.logs.length > 0 ? (
                    result.logs.map((log, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          mb: 2, 
                          p: 2, 
                          bgcolor: 'grey.100', 
                          borderRadius: 1,
                          borderLeft: '4px solid',
                          borderColor: 'primary.main'
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {log.timestamp} | {log.app} | {log.pod}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ mt: 1, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
                        >
                          {log.message}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Alert severity="info">Логи не найдены</Alert>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Данные из MongoDB */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="secondary">
                    База данных MongoDB
                  </Typography>
                  {renderDataSection(
                    'MongoDB', 
                    result.mongo_data, 
                    expandedMongo, 
                    setExpandedMongo,
                    'secondary'
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Данные из PostgreSQL */}
                <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="success">
                    База данных PostgreSQL
                </Typography>
                
                {!result.postgres_data || result.postgres_data.length === 0 ? (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                    В постгресе объекта нет
                    </Alert>
                ) : (
                    <Box sx={{ mt: 2 }}>
                    <Box 
                        sx={{ 
                        p: 2, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1,
                        borderLeft: '4px solid',
                        borderColor: 'success.main'
                        }}
                    >
                        <Typography variant="body1" gutterBottom>
                        <strong>Объект в постгресе:</strong> {result.postgres_data[0].unit_name}
                        </Typography>
                        
                        <Button
                        onClick={() => setExpandedPostgres(!expandedPostgres)}
                        endIcon={expandedPostgres ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ mt: 1 }}
                        variant="outlined"
                        size="small"
                        >
                        {expandedPostgres ? 'Скрыть детали' : 'Подробнее'}
                        </Button>

                        <Collapse in={expandedPostgres} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                            Полное сообщение:
                            </Typography>
                            <pre style={{ 
                            overflow: 'auto', 
                            fontSize: '12px',
                            backgroundColor: '#f5f5f5',
                            padding: '12px',
                            borderRadius: '4px',
                            maxHeight: '400px'
                            }}>
                            {JSON.stringify(result.postgres_data[0].data, null, 2)}
                            </pre>
                        </Box>
                        </Collapse>
                    </Box>
                    </Box>
                )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Данные из Consumer */}
                <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="warning">
                    Consumer
                </Typography>
                {result.consumer_data && result.consumer_data.length > 0 ? (
                    result.consumer_data.map((log, index) => (
                    <Box 
                        key={index} 
                        sx={{ 
                        mb: 2, 
                        p: 2, 
                        bgcolor: 'grey.100', 
                        borderRadius: 1,
                        borderLeft: '4px solid',
                        borderColor: 'warning.main'
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                        {log.timestamp} | {log.app} | {log.pod}
                        </Typography>
                        <Typography 
                        variant="body2" 
                        sx={{ mt: 1, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
                        >
                        {log.message}
                        </Typography>
                    </Box>
                    ))
                ) : (
                    <Alert severity="info">Логи консьюмера не найдены</Alert>
                )}
                </Box>
                <Divider sx={{ my: 3 }} />

                {/* Данные из Redis */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="error">
                    Кэш Redis - пока не работает
                  </Typography>
                  {renderDataSection(
                    'Redis', 
                    result.redis_data, 
                    expandedRedis, 
                    setExpandedRedis,
                    'error'
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default IdentCheckPage;
