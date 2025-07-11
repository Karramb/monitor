import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  Box, 
  Alert
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import StorageIcon from '@mui/icons-material/Storage';
import BoltIcon from '@mui/icons-material/Bolt';
import CachedIcon from '@mui/icons-material/Cached';
import InfoIcon from '@mui/icons-material/Info';
import { useNavigate } from 'react-router-dom';

import UpdateInfo from './UpdateInfo';
import LoadingOverlay from './LoadingOverlay';

const HostCard = ({ host }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [lastCommit, setLastCommit] = useState(null);
  const [commitHash, setCommitHash] = useState(null);

  const socketRef = useRef(null);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef(null);

  const showAlert = useCallback((severity, message) => {
    if (mountedRef.current) {
      setAlert({ severity, message });
      setTimeout(() => {
        if (mountedRef.current) setAlert(null);
      }, 5000);
    }
  }, []);

  const handleWebSocketMessage = useCallback((data) => {
    console.log("WebSocket message:", data);
    if (!mountedRef.current) return;
    if (data?.config_status) setStatus(data.config_status);
    if (data?.error) showAlert('error', data.error);

    if (data?.last_update) setLastUpdate(data.last_update);
    if (data?.last_commit) setLastCommit(data.last_commit);
    if (data?.commitHash) setCommitHash(data.commitHash);

    if (data?.action) {
      if (data.action.endsWith('_started')) {
        setLoading(true);
      } else if (data.action.endsWith('_completed')) {
        setLoading(false);
      }
    }
  }, [showAlert]);

  const connectWebSocket = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      console.log("WebSocket already connecting or open");
      return;
    }

    console.log("Initializing WebSocket connection...");
    setStatus('Подключение...');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    const port = 8000;
    const wsUrl = `${protocol}//${hostname}:${port}/ws/core/${host.id}/`;
    console.log("WebSocket URL:", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      const timeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error("WebSocket connection timeout");
          ws.close();
          if (mountedRef.current) {
            setStatus('Таймаут подключения');
            showAlert('error', 'Таймаут подключения к серверу');
          }
        }
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        if (!mountedRef.current) return;
        console.log("WebSocket successfully connected");
        setStatus('Подключено');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error("Ошибка парсинга сообщения WebSocket:", err, "Получено:", event.data);
        }
      };

      ws.onerror = (event) => {
        clearTimeout(timeout);
        if (!mountedRef.current) return;
        console.error("WebSocket error:", event);
        setStatus('Ошибка подключения');
        showAlert('error', 'Ошибка соединения с сервером');
      };

      ws.onclose = (event) => {
        clearTimeout(timeout);
        if (!mountedRef.current) return;
        console.log("WebSocket closed:", event.code, event.reason);
        setLoading(false);
        if (event.code !== 1000) {
          setStatus('Соединение закрыто, пытаемся восстановить...');
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) connectWebSocket();
          }, 3000);
        } else {
          setStatus('Отключено');
        }
      };
    } catch (error) {
      console.error("Ошибка инициализации WebSocket:", error);
      if (mountedRef.current) setStatus('Ошибка инициализации');
    }
  }, [host.id, handleWebSocketMessage, showAlert]);

  useEffect(() => {
    mountedRef.current = true;
    connectWebSocket();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        socketRef.current.close(1000, "Component unmount");
      }
      socketRef.current = null;
    };
  }, [connectWebSocket]);

  const getStatusColor = () => {
    if (status.toLowerCase().includes("тестовая")) return "warning";
    if (status.toLowerCase().includes("продакшн")) return "success";
    if (status === "Подключено") return "success";
    if (status.toLowerCase().includes("ошибка")) return "error";
    return "default";
  };

  const handleAction = (action, confirmMessage) => {
    if (window.confirm(confirmMessage)) {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ action }));
      } else {
        showAlert('error', 'Нет активного соединения');
      }
    }
  };

  return (
    <Card sx={{ 
      width: 430, 
      mb: 2, 
      mr: 2, 
      position: 'relative', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      <CardContent sx={{ p: 2, flexGrow: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 1.5 
        }}>
          <Typography 
            variant="subtitle1" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '70%'
            }}
          >
            {host.name}
          </Typography>
          {commitHash && (
            <Typography 
              variant="caption" 
              sx={{
                fontFamily: 'monospace',
                backgroundColor: 'rgba(0, 0, 0, 0.20)',
                px: 1,
                borderRadius: 1,
                whiteSpace: 'nowrap',
                color: 'text.secondary'
              }}
            >
              {commitHash.substring(0, 8)}
            </Typography>
          )}
        </Box>

        <Box sx={{ mb: 1 }}>
          <Chip 
            label={status || 'Подключение...'}
            color={getStatusColor()}
            size="small"
            sx={{ width: '100%', fontSize: '0.75rem', py: 0.5 }}
          />
        </Box>

        <UpdateInfo 
          lastUpdate={lastUpdate} 
          lastCommit={lastCommit} 
        />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<SwapHorizIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => handleAction('toggle_mongo', 'Переключить базу данных?')}
            sx={{ flex: '1 1 45%', fontSize: '0.75rem', py: 0.6, minWidth: 0 }}
            disabled={loading}
          >
            Переключить базу
          </Button>
          <Button
            variant="contained"
            size="small"
            color="success"
            startIcon={<StorageIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => handleAction('restore_backup', 'Накатить дамп PG?')}
            sx={{ flex: '1 1 45%', fontSize: '0.75rem', py: 0.6, minWidth: 0 }}
            disabled={loading}
          >
            Накатить дамп
          </Button>
          <Button
            variant="contained"
            size="small"
            color="info"
            startIcon={<BoltIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => handleAction('fast_pull', 'Выполнить Fast test?')}
            sx={{ flex: '1 1 45%', fontSize: '0.75rem', py: 0.6, minWidth: 0 }}
            disabled={loading}
          >
            Fast test
          </Button>
          <Button
            variant="contained"
            size="small"
            color="warning"
            startIcon={<CachedIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => handleAction('pull_with_reload', 'Выполнить Full test?')}
            sx={{ flex: '1 1 45%', fontSize: '0.75rem', py: 0.6, minWidth: 0 }}
            disabled={loading}
          >
            Full test
          </Button>
        </Box>

        {alert && (
          <Box mt={1.5}>
            <Alert severity={alert.severity} sx={{ fontSize: '0.75rem', py: 0.5 }}>
              {alert.message}
            </Alert>
          </Box>
        )}
      </CardContent>

      <Button
        variant="outlined"
        fullWidth
        startIcon={<InfoIcon />}
        onClick={() => navigate(`/hosts/${host.id}`)}
        sx={{
          borderRadius: '0 0 4px 4px',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        Подробнее
      </Button>

      {loading && <LoadingOverlay />}
    </Card>
  );
};

export default HostCard;