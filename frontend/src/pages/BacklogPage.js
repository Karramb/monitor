// BacklogPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  MenuItem,
  Box,
  Typography,
  Skeleton
} from '@mui/material';
import axios from 'axios';

const BacklogPage = () => {
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    group: '',
    tag: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, groupsRes, tagsRes] = await Promise.all([
          axios.get('/api/backlog/'),
          axios.get('/api/groups/'),
          axios.get('/api/tags/')
        ]);
        setTasks(tasksRes.data);
        setGroups(groupsRes.data);
        setTags(tagsRes.data);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredTasks = tasks.filter(task => {
    return (
      (filters.status === '' || task.status === filters.status) &&
      (filters.group === '' || task.groups.id.toString() === filters.group) &&
      (filters.tag === '' || task.tags.some(tag => tag.id.toString() === filters.tag))
    );
  });

  return (
    <Box sx={{ 
      p: 4,
      maxWidth: '100%',
      width: '100vw',
      margin: 0,
      minHeight: '100vh'
    }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, mb: 3 }}>Бэклог задач</Typography>
      
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        '& .MuiTextField-root': { 
          minWidth: 180,
          '& .MuiInputBase-root': {
            height: 40
          }
        }
      }}>
        <TextField
          select
          label="Статус"
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          size="small"
        >
          <MenuItem value="">Все</MenuItem>
          <MenuItem value="open">Открыта</MenuItem>
          <MenuItem value="in_progress">В работе</MenuItem>
          <MenuItem value="closed">Закрыта</MenuItem>
        </TextField>

        <TextField
          select
          label="Группа"
          name="group"
          value={filters.group}
          onChange={handleFilterChange}
          size="small"
        >
          <MenuItem value="">Все</MenuItem>
          {groups.map(group => (
            <MenuItem key={group.id} value={group.id}>
              {group.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Тег"
          name="tag"
          value={filters.tag}
          onChange={handleFilterChange}
          size="small"
        >
          <MenuItem value="">Все</MenuItem>
          {tags.map(tag => (
            <MenuItem key={tag.id} value={tag.id}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  width: 14, 
                  height: 14, 
                  bgcolor: tag.color, 
                  mr: 1, 
                  borderRadius: '2px' 
                }} />
                {tag.name}
              </Box>
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <TableContainer component={Paper} sx={{ 
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider',
        '& .MuiTableCell-root': {
          py: 1,
          px: 2,
          fontSize: '0.875rem'
        }
      }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ 
              '& .MuiTableCell-root': { 
                fontWeight: 500,
                backgroundColor: 'action.hover'
              }
            }}>
              <TableCell width={60}>ID</TableCell>
              <TableCell>Тема</TableCell>
              <TableCell width={150}>Группа</TableCell>
              <TableCell width={200}>Теги</TableCell>
              <TableCell width={120}>Статус</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array(5).fill().map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                </TableRow>
              ))
            ) : (
              filteredTasks.map(task => (
                <TableRow key={task.id} hover>
                  <TableCell>{task.id}</TableCell>
                  <TableCell>
                    <Link 
                      to={`/backlog/${task.id}`} 
                      style={{ 
                        textDecoration: 'none',
                        color: 'inherit',
                        fontWeight: 500
                      }}
                    >
                      {task.theme}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={task.groups.name} 
                      size="small" 
                      sx={{ 
                        height: 24,
                        fontSize: '0.75rem'
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {task.tags.map(tag => (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          sx={{ 
                            backgroundColor: tag.color,
                            color: 'white',
                            height: 22,
                            fontSize: '0.7rem',
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ 
                      display: 'inline-block',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: task.status === 'open' ? 'info.main' : 
                            task.status === 'in_progress' ? 'warning.main' : 
                            'success.main',
                      bgcolor: task.status === 'open' ? 'info.light' : 
                              task.status === 'in_progress' ? 'warning.light' : 
                              'success.light'
                    }}>
                      {task.status === 'open' && 'Открыта'}
                      {task.status === 'in_progress' && 'В работе'}
                      {task.status === 'closed' && 'Закрыта'}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BacklogPage;