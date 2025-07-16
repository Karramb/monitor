import React, { useEffect, useState } from 'react';
import {
  Box, Button, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Select, MenuItem, FormControl, InputLabel,
  Typography, Card, CardContent, Fade, Grow, Avatar, Tooltip
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Add as AddIcon, 
  FilterList as FilterIcon, 
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Create as CreateIcon
} from '@mui/icons-material';

function BacklogPage() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [groupMap, setGroupMap] = useState(new Map());

  useEffect(() => {
    axios.get('/api/backlog/')
      .then(res => setTasks(res.data))
      .catch(err => console.error('Ошибка при загрузке задач:', err));

    axios.get('/api/groups/')
      .then(res => {
        setGroups(res.data);
        setGroupMap(new Map(res.data.map(g => [g.id, g.name])));
      })
      .catch(err => console.error('Ошибка при загрузке групп:', err));

    axios.get('/api/tags/')
      .then(res => setTags(res.data))
      .catch(err => console.error('Ошибка при загрузке тегов:', err));
  }, []);

  const handleStatusChange = (e) => setSelectedStatus(e.target.value);
  const handleGroupChange = (e) => setSelectedGroup(e.target.value);
  const handleTagChange = (e) => setSelectedTag(e.target.value);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'Create':
        return { 
          text: 'Создана', 
          color: '#1976d2', 
          bgColor: '#e3f2fd',
          icon: <CreateIcon sx={{ fontSize: 14 }} />
        };
      case 'Accepted':
        return { 
          text: 'Принята', 
          color: '#f57c00', 
          bgColor: '#fff3e0',
          icon: <PlayArrowIcon sx={{ fontSize: 14 }} />
        };
      case 'In_test':
        return { 
          text: 'В тесте', 
          color: '#7b1fa2', 
          bgColor: '#f3e5f5',
          icon: <ScheduleIcon sx={{ fontSize: 14 }} />
        };
      case 'Done':
        return { 
          text: 'Выполнена', 
          color: '#388e3c', 
          bgColor: '#e8f5e8',
          icon: <CheckCircleIcon sx={{ fontSize: 14 }} />
        };
      default:
        return { 
          text: status || '—', 
          color: '#666666', 
          bgColor: '#f5f5f5',
          icon: <AssignmentIcon sx={{ fontSize: 14 }} />
        };
    }
  };

  const filteredTasks = tasks.filter(task => {
    // Если статус не выбран, скрываем выполненные задачи по умолчанию
    const statusFilter = selectedStatus ? 
      task.status === selectedStatus : 
      task.status !== 'Done';
    
    return (
      statusFilter &&
      (!selectedGroup || task.groups === selectedGroup) &&
      (!selectedTag || task.tags.includes(selectedTag))
    );
  });

  const handleCreateClick = () => {
    navigate('/backlog/new');
  };

  const getStatusStats = () => {
    const allTasks = tasks; // Все задачи для подсчета общей статистики
    const stats = {
      total: filteredTasks.length,
      create: filteredTasks.filter(t => t.status === 'Create').length,
      accepted: filteredTasks.filter(t => t.status === 'Accepted').length,
      in_test: filteredTasks.filter(t => t.status === 'In_test').length,
      done: allTasks.filter(t => t.status === 'Done').length // Всегда показываем общее количество выполненных
    };
    return stats;
  };

  const stats = getStatusStats();

  return (
    <Box sx={{ 
      padding: 3, 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    }}>
      {/* Header Card */}
      <Fade in timeout={800}>
        <Card sx={{ 
          mb: 3, 
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderRadius: 3
        }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ 
                  bgcolor: '#1976d2', 
                  width: 40, 
                  height: 40,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 700, 
                    color: '#1a1a1a',
                    mb: 0.5
                  }}>
                    Backlog
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Управление задачами проекта
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="contained" 
                size="medium"
                startIcon={<AddIcon />}
                onClick={handleCreateClick}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  px: 2.5,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 16px rgba(102,126,234,0.4)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(102,126,234,0.5)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Создать задачу
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Fade>

      {/* Stats Cards */}
      <Fade in timeout={1000}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Card sx={{ 
            flex: 1, 
            minWidth: 100,
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 1, px: 2 }}>
              <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 700, fontSize: '1.1rem' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ color: '#1976d2', fontSize: '0.75rem' }}>
                Всего
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ 
            flex: 1, 
            minWidth: 100,
            background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 1, px: 2 }}>
              <Typography variant="h6" sx={{ color: '#388e3c', fontWeight: 700, fontSize: '1.1rem' }}>
                {stats.done}
              </Typography>
              <Typography variant="body2" sx={{ color: '#388e3c', fontSize: '0.75rem' }}>
                Выполнено
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ 
            flex: 1, 
            minWidth: 100,
            background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 1, px: 2 }}>
              <Typography variant="h6" sx={{ color: '#7b1fa2', fontWeight: 700, fontSize: '1.1rem' }}>
                {stats.in_test}
              </Typography>
              <Typography variant="body2" sx={{ color: '#7b1fa2', fontSize: '0.75rem' }}>
                В тесте
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Fade>

      {/* Filters Card */}
      <Grow in timeout={1200}>
        <Card sx={{ 
          mb: 3,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon sx={{ color: '#666', fontSize: 20 }} />
                <Typography variant="h6" sx={{ color: '#333', fontWeight: 600, fontSize: '1rem' }}>
                  Фильтры
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: 1 }}>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Статус</InputLabel>
                  <Select 
                    value={selectedStatus} 
                    label="Статус" 
                    onChange={handleStatusChange}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">Все (кроме выполненных)</MenuItem>
                    <MenuItem value="Create">Создана</MenuItem>
                    <MenuItem value="In_test">В тесте</MenuItem>
                    <MenuItem value="Accepted">Принята</MenuItem>
                    <MenuItem value="Done">Выполнена</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Группа</InputLabel>
                  <Select 
                    value={selectedGroup} 
                    label="Группа" 
                    onChange={handleGroupChange}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">Все</MenuItem>
                    {groups.map(group => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Тег</InputLabel>
                  <Select 
                    value={selectedTag} 
                    label="Тег" 
                    onChange={handleTagChange}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">Все</MenuItem>
                    {tags.map(tag => (
                      <MenuItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grow>

      {/* Tasks Table */}
      <Fade in timeout={1400}>
        <Card sx={{ 
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                }}>
                  <TableCell sx={{ fontWeight: 700, color: '#333' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#333' }}>Тема</TableCell>
                  <TableCell sx={{ width: 100, fontWeight: 700, color: '#333' }}>Группа</TableCell>
                  <TableCell sx={{ width: 160, fontWeight: 700, color: '#333' }}>Теги</TableCell>
                  <TableCell sx={{ width: 110, fontWeight: 700, color: '#333' }}>Статус</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.map((task, index) => {
                  const groupName = groupMap.get(task.groups) || '—';
                  const statusInfo = getStatusInfo(task.status);
                  
                  return (
                    <Grow in timeout={800 + index * 100} key={task.id}>
                      <TableRow 
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: '#f8f9fa',
                            transform: 'scale(1.01)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          },
                          transition: 'all 0.2s ease',
                          '&:nth-of-type(odd)': {
                            backgroundColor: 'rgba(0,0,0,0.02)'
                          }
                        }}
                      >
                        <TableCell>
                          <Chip 
                            label={`#${task.id}`}
                            size="small"
                            sx={{ 
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2',
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Link to={`/backlog/${task.id}`} style={{
                            color: '#1976d2', 
                            textDecoration: 'none', 
                            fontWeight: 500,
                            fontSize: '0.9rem'
                          }}>
                            {task.theme}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={groupName}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.75rem',
                              borderRadius: 2
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {task.tags.map(tagId => {
                              const tag = tags.find(t => t.id === tagId);
                              return tag ? (
                                <Tooltip title={tag.name} key={tag.id}>
                                  <Chip
                                    label={tag.name}
                                    size="small"
                                    sx={{
                                      backgroundColor: tag.color,
                                      fontSize: '0.7rem',
                                      height: 22,
                                      borderRadius: 2,
                                      fontWeight: 500,
                                      '&:hover': {
                                        transform: 'scale(1.05)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                      },
                                      transition: 'all 0.2s ease'
                                    }}
                                  />
                                </Tooltip>
                              ) : null;
                            })}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.5, 
                            py: 0.5, 
                            borderRadius: 2, 
                            fontSize: '0.75rem',
                            fontWeight: 600, 
                            backgroundColor: statusInfo.bgColor,
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.color}20`,
                            width: 'fit-content'
                          }}>
                            {statusInfo.icon}
                            {statusInfo.text}
                          </Box>
                        </TableCell>
                      </TableRow>
                    </Grow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Fade>
    </Box>
  );
}

export default BacklogPage;