import React, { useEffect, useState } from 'react';
import {
  Box, Button, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
        return { text: 'Создана', color: '#000000', bgColor: '#ffffff' };
      case 'Accepted':
        return { text: 'Принята', color: '#000000', bgColor: '#fff2cc' };
      case 'In_test':
        return { text: 'В тесте', color: '#000000', bgColor: '#fce5cd' };
      case 'Done':
        return { text: 'Выполнена', color: '#000000', bgColor: '#d9ead3' };
      default:
        return { text: status || '—', color: '#000000', bgColor: '#ffffff' };
    }
  };

  const filteredTasks = tasks.filter(task => {
    return (
      (!selectedStatus || task.status === selectedStatus) &&
      (!selectedGroup || task.groups === selectedGroup) &&
      (!selectedTag || task.tags.includes(selectedTag))
    );
  });

  // Функция для перехода на страницу создания задачи
  const handleCreateClick = () => {
    navigate('/backlog/new');
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h2>Backlog</h2>
        <Button variant="contained" color="primary" onClick={handleCreateClick}>
          Создать задачу
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Статус</InputLabel>
          <Select value={selectedStatus} label="Статус" onChange={handleStatusChange}>
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="Create">Создана</MenuItem>
            <MenuItem value="In_test">В тесте</MenuItem>
            <MenuItem value="Accepted">Принята</MenuItem>
            <MenuItem value="Done">Выполнена</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Группа</InputLabel>
          <Select value={selectedGroup} label="Группа" onChange={handleGroupChange}>
            <MenuItem value="">Все</MenuItem>
            {groups.map(group => (
              <MenuItem key={group.id} value={group.id}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Тег</InputLabel>
          <Select value={selectedTag} label="Тег" onChange={handleTagChange}>
            <MenuItem value="">Все</MenuItem>
            {tags.map(tag => (
              <MenuItem key={tag.id} value={tag.id}>
                {tag.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Тема</TableCell>
              <TableCell sx={{ width: 100 }}>Группа</TableCell>
              <TableCell sx={{ width: 160 }}>Теги</TableCell>
              <TableCell sx={{ width: 110 }}>Статус</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTasks.map(task => {
              const groupName = groupMap.get(task.groups) || '—';
              return (
                <TableRow key={task.id}>
                  <TableCell>{task.id}</TableCell>
                  <TableCell>
                    <Link to={`/backlog/${task.id}`} style={{
                      color: '#2a5885', textDecoration: 'none', fontWeight: 500
                    }}>
                      {task.theme}
                    </Link>
                  </TableCell>
                  <TableCell>{groupName}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {task.tags.map(tagId => {
                        const tag = tags.find(t => t.id === tagId);
                        return tag ? (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            size="small"
                            sx={{
                              backgroundColor: tag.color,
                              fontSize: '0.7rem',
                              height: 22,
                              borderRadius: '3px'
                            }}
                          />
                        ) : null;
                      })}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{
                      px: 1, py: 0.3, borderRadius: '3px', fontSize: '0.75rem',
                      fontWeight: 500, backgroundColor: getStatusInfo(task.status).bgColor,
                      color: getStatusInfo(task.status).color, border: '1px solid #d0d0d0'
                    }}>
                      {getStatusInfo(task.status).text}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default BacklogPage;
