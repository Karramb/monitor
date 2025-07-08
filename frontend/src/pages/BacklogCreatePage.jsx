import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  OutlinedInput,
  Checkbox,
  ListItemText,
  IconButton,
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';

const STATUS_OPTIONS = [
  { value: 'Create', label: 'Создана' },
  { value: 'Accepted', label: 'Принята' },
  { value: 'In_test', label: 'В тесте' },
  { value: 'Done', label: 'Выполнена' },
];

const BacklogCreatePage = () => {
  const [theme, setTheme] = useState('');
  const [status, setStatus] = useState('Create');
  const [text, setText] = useState('');
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const getCsrfToken = () => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return cookieValue;
  };

  useEffect(() => {
    axios.defaults.xsrfCookieName = 'csrftoken';
    axios.defaults.xsrfHeaderName = 'X-CSRFToken';
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Пожалуйста, войдите в систему');
        navigate('/login');
        return;
      }

      const authHeader = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      try {
        const [groupsRes, tagsRes] = await Promise.all([
          axios.get('/api/groups/', authHeader),
          axios.get('/api/tags/', authHeader),
        ]);
        setGroups(groupsRes.data);
        setTags(tagsRes.data);
        if (groupsRes.data.length) setGroupId(groupsRes.data[0].id);
      } catch (error) {
        console.error('Ошибка при загрузке групп и тегов:', error);
        if (error.response?.status === 401) {
          alert('Сессия истекла. Пожалуйста, войдите в систему снова.');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        alert('Ошибка при загрузке данных. Попробуйте снова.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Добавляем файлы, не заменяя существующие
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  // Удаление отдельного файла из списка
  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!theme || !text || !groupId) {
      alert('Пожалуйста, заполните обязательные поля');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Пожалуйста, войдите в систему');
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('theme', theme);
    formData.append('status', status);
    formData.append('text', text);
    formData.append('groups', groupId);
    selectedTags.forEach(tagId => formData.append('tags', tagId));
    attachments.forEach(file => formData.append('attachments', file)); // Обрати внимание на 'attachments' (множественное)

    try {
      const csrfToken = getCsrfToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };

      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      await axios.post('/api/backlog/', formData, { headers });

      alert('Задача успешно создана!');
      navigate('/backlog');
    } catch (error) {
      console.error('Ошибка при создании задачи:', error);

      if (error.response?.status === 401) {
        alert('Сессия истекла. Пожалуйста, войдите в систему снова.');
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert('Недостаточно прав для создания задачи. Попробуйте обновить страницу.');
        console.log('Response data:', error.response.data);
      } else if (error.response?.status === 400) {
        alert('Ошибка в данных формы. Проверьте все поля.');
        console.log('Validation errors:', error.response.data);
      } else {
        alert('Ошибка при создании задачи. Попробуйте снова.');
      }
    }
  };

  if (loading) return <Typography>Загрузка...</Typography>;

  return (
    <Box maxWidth="md" mx="auto" p={2}>
      <Typography variant="h5" gutterBottom>Создать задачу</Typography>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <TextField
          label="Тема"
          fullWidth
          margin="normal"
          value={theme}
          onChange={e => setTheme(e.target.value)}
          required
        />

        <FormControl fullWidth margin="normal">
          <InputLabel id="status-label">Статус</InputLabel>
          <Select
            labelId="status-label"
            value={status}
            label="Статус"
            onChange={e => setStatus(e.target.value)}
            required
          >
            {STATUS_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Описание"
          fullWidth
          multiline
          rows={4}
          margin="normal"
          value={text}
          onChange={e => setText(e.target.value)}
          required
        />

        <FormControl fullWidth margin="normal">
          <InputLabel id="group-label">Группа</InputLabel>
          <Select
            labelId="group-label"
            value={groupId}
            label="Группа"
            onChange={e => setGroupId(e.target.value)}
            required
          >
            {groups.map(g => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel id="tags-label">Теги</InputLabel>
          <Select
            labelId="tags-label"
            multiple
            value={selectedTags}
            onChange={e => setSelectedTags(e.target.value)}
            input={<OutlinedInput label="Теги" />}
            renderValue={(selected) =>
              tags
                .filter(t => selected.includes(t.id))
                .map(t => t.name)
                .join(', ')
            }
          >
            {tags.map(tag => (
              <MenuItem key={tag.id} value={tag.id}>
                <Checkbox checked={selectedTags.indexOf(tag.id) > -1} />
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    bgcolor: tag.color || '#ccc',
                    mr: 1,
                    borderRadius: '2px',
                    border: '1px solid #999',
                  }}
                />
                <ListItemText primary={tag.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" component="label" sx={{ mt: 2 }}>
          Загрузить файлы
          <input type="file" hidden multiple onChange={handleFileChange} />
        </Button>

        {attachments.length > 0 && (
          <Box mt={1}>
            <Typography variant="body2">Выбранные файлы:</Typography>
            {attachments.map((file, index) => (
              <Box key={index} display="flex" alignItems="center" mt={0.5}>
                <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>
                  {file.name}
                </Typography>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveAttachment(index)}
                  aria-label="Удалить файл"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        <Box mt={3}>
          <Button type="submit" variant="contained" color="primary">
            Создать
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default BacklogCreatePage;
