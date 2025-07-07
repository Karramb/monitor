import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Skeleton,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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

  const getStatusInfo = (status) => {
    switch(status) {
      case 'Create': return { text: 'Создана', color: '#000000', bgColor: '#ffffff' };
      case 'Accepted': return { text: 'Принята', color: '#000000', bgColor: '#fff2cc' };
      case 'In_test': return { text: 'В тесте', color: '#000000', bgColor: '#fce5cd' };
      case 'Done': return { text: 'Выполнена', color: '#000000', bgColor: '#d9ead3' };
      default: return { text: status, color: '#000000', bgColor: '#ffffff' };
    }
  };

  return (
    <Box sx={{ 
      width: '100%',
      p: 2,
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        p: 2,
        backgroundColor: '#ffffff',
        borderRadius: 1,
        boxShadow: '0px 1px 3px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>Бэклог задач</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          component={Link}
          to="/backlog/new"
          sx={{
            backgroundColor: '#4472c4',
            color: '#ffffff',
            '&:hover': { backgroundColor: '#3a62b0' }
          }}
        >
          Создать задачу
        </Button>
      </Box>

      <Box sx={{ 
        display: 'flex',
        gap: 2,
        mb: 2,
        p: 2,
        backgroundColor: '#ffffff',
        borderRadius: 1,
        boxShadow: '0px 1px 3px rgba(0,0,0,0.1)'
      }}>
        <TextField
          select
          label="Статус"
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          size="small"
          sx={{ minWidth: 150, backgroundColor: '#ffffff' }}
        >
          <MenuItem value="">Все статусы</MenuItem>
          <MenuItem value="Create">Создана</MenuItem>
          <MenuItem value="Accepted">Принята</MenuItem>
          <MenuItem value="In_test">В тесте</MenuItem>
          <MenuItem value="Done">Выполнена</MenuItem>
        </TextField>

        <TextField
          select
          label="Группа"
          name="group"
          value={filters.group}
          onChange={handleFilterChange}
          size="small"
          sx={{ minWidth: 150, backgroundColor: '#ffffff' }}
        >
          <MenuItem value="">Все группы</MenuItem>
          {groups.map(group => (
            <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Тег"
          name="tag"
          value={filters.tag}
          onChange={handleFilterChange}
          size="small"
          sx={{ minWidth: 150, backgroundColor: '#ffffff' }}
        >
          <MenuItem value="">Все теги</MenuItem>
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

      <Paper sx={{ 
        width: '100%',
        overflow: 'auto',
        borderRadius: 1,
        boxShadow: '0px 1px 3px rgba(0,0,0,0.1)'
      }}>
        <TableContainer>
          <Table sx={{ 
            minWidth: 800,
            '& .MuiTableCell-root': {
              border: '1px solid #e0e0e0',
              py: '6px',
              px: '12px',
              fontSize: '0.875rem',
              height: '36px'
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              backgroundColor: '#f2f2f2',
              fontWeight: 500,
              borderBottom: '2px solid #e0e0e0'
            },
            '& .MuiTableRow-root:hover': {
              backgroundColor: '#f5f9ff'
            }
          }}>
            <TableHead>
              <TableRow>
                <TableCell width={60} sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell minWidth={300} sx={{ fontWeight: 600 }}>Тема</TableCell>
                <TableCell width={150} sx={{ fontWeight: 600 }}>Группа</TableCell>
                <TableCell width={200} sx={{ fontWeight: 600 }}>Теги</TableCell>
                <TableCell width={120} sx={{ fontWeight: 600 }}>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array(10).fill().map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton height={24} /></TableCell>
                    <TableCell><Skeleton height={24} /></TableCell>
                    <TableCell><Skeleton height={24} /></TableCell>
                    <TableCell><Skeleton height={24} /></TableCell>
                    <TableCell><Skeleton height={24} /></TableCell>
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
                          color: '#2a5885',
                          textDecoration: 'none',
                          fontWeight: 500,
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {task.theme}
                      </Link>
                    </TableCell>
                    <TableCell>{groups.find(g => g.id === task.groups)?.name || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {task.tags.map(tagId => {
                          const tagObj = tags.find(t => t.id === tagId);
                          return tagObj ? (
                            <Chip
                              key={tagObj.id}
                              label={tagObj.name}
                              size="small"
                              sx={{ 
                                backgroundColor: tagObj.color,
                                color: '#fff',
                                fontSize: '0.7rem',
                                height: '22px',
                                borderRadius: '3px'
                              }}
                            />
                          ) : null;
                        })}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'inline-block',
                        px: 1,
                        py: 0.3,
                        borderRadius: '3px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: getStatusInfo(task.status).bgColor,
                        color: getStatusInfo(task.status).color,
                        border: '1px solid #d0d0d0'
                      }}>
                        {getStatusInfo(task.status).text}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default BacklogPage;