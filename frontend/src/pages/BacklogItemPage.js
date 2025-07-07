import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  MenuItem,
  Skeleton,
  IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import axios from 'axios';

const getAccessToken = () => localStorage.getItem('token');

const getAuthHeaders = () => {
  const token = getAccessToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const isImage = (filename) => {
  return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename);
};

const BacklogItemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentFile, setCommentFile] = useState(null);
  const [groupsMap, setGroupsMap] = useState({});
  const [tagsMap, setTagsMap] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  // Новое состояние для редактирования темы
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  const [editedTheme, setEditedTheme] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taskRes, commentsRes, groupsRes, tagsRes, userRes] = await Promise.all([
          axios.get(`/api/backlog/${id}/`, { headers: getAuthHeaders() }),
          axios.get(`/api/backlog/${id}/comments/`, { headers: getAuthHeaders() }),
          axios.get('/api/groups/', { headers: getAuthHeaders() }),
          axios.get('/api/tags/', { headers: getAuthHeaders() }),
          axios.get('/api/users/me/', { headers: getAuthHeaders() })
        ]);

        setTask(taskRes.data);
        setEditedTheme(taskRes.data.theme);
        setStatus(taskRes.data.status);
        setComments(commentsRes.data);
        setCurrentUser(userRes.data);

        const groups = groupsRes.data.reduce((acc, group) => {
          acc[group.id] = group;
          return acc;
        }, {});
        const tags = tagsRes.data.reduce((acc, tag) => {
          acc[tag.id] = tag;
          return acc;
        }, {});

        setGroupsMap(groups);
        setTagsMap(tags);

      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        navigate('/backlog');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleStatusChange = async () => {
    try {
      const response = await axios.patch(
        `/api/backlog/${id}/`,
        { status },
        { headers: getAuthHeaders() }
      );
      setTask(response.data);
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('attachment', file);

    try {
      const response = await axios.patch(
        `/api/backlog/${id}/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`
          }
        }
      );
      setTask(response.data);
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
    }
  };

  const handleCommentFileChange = (e) => {
    setCommentFile(e.target.files[0]);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const formData = new FormData();
    formData.append('text', newComment);
    if (commentFile) {
      formData.append('attachment', commentFile);
    }

    try {
      const response = await axios.post(
        `/api/backlog/${id}/comments/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`
          }
        }
      );

      setComments([response.data, ...comments]);
      setNewComment('');
      setCommentFile(null);
    } catch (error) {
      console.error('Ошибка:', error.response?.data);
    }
  };

  // Новая функция для сохранения темы
  const handleSaveTheme = async () => {
    try {
      const response = await axios.patch(
        `/api/backlog/${id}/`,
        { theme: editedTheme },
        { headers: getAuthHeaders() }
      );
      setTask(response.data);
      setIsEditingTheme(false);
    } catch (error) {
      console.error('Ошибка сохранения темы:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 3 }} />
      </Box>
    );
  }

  if (!task) return <Typography>Задача не найдена</Typography>;

  const isAuthor = currentUser && task.author === currentUser.username;

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        pb: 2,
        borderBottom: '1px solid #e0e0e0'
      }}>
        {/* Редактируемая тема */}
        {isEditingTheme ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              value={editedTheme}
              onChange={(e) => setEditedTheme(e.target.value)}
              size="small"
              sx={{ minWidth: 300 }}
            />
            <Button size="small" variant="contained" onClick={handleSaveTheme}>
              Сохранить
            </Button>
            <Button size="small" onClick={() => { setIsEditingTheme(false); setEditedTheme(task.theme); }}>
              Отмена
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              {task.theme}
            </Typography>
            {isAuthor && (
              <Button size="small" onClick={() => setIsEditingTheme(true)}>
                Редактировать
              </Button>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            size="small"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="Create">Создана</MenuItem>
            <MenuItem value="Accepted">Принята</MenuItem>
            <MenuItem value="In_test">В тесте</MenuItem>
            <MenuItem value="Done">Выполнена</MenuItem>
          </TextField>
          <Button
            variant="contained"
            size="small"
            onClick={handleStatusChange}
          >
            Сохранить
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
        <Typography variant="h6" gutterBottom>Описание</Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {task.text}
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>Группа:</Typography>
            <Chip label={groupsMap[task.groups]?.name || '—'} size="small" />
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>Теги:</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {task.tags?.map(tagId => {
                const tag = tagsMap[tagId];
                return tag ? (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    sx={{
                      backgroundColor: tag.color,
                      color: '#fff',
                      fontSize: '0.7rem'
                    }}
                  />
                ) : null;
              })}
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>Файл:</Typography>
            {task.attachment ? (
              <Button
                size="small"
                onClick={() => window.open(task.attachment)}
              >
                Скачать
              </Button>
            ) : (
              isAuthor && (
                <>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button
                      component="span"
                      size="small"
                      startIcon={<AttachFileIcon />}
                    >
                      Редактировать
                    </Button>
                  </label>
                </>
              )
            )}
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, border: '1px solid #e0e0e0' }}>
        <Typography variant="h6" gutterBottom>Комментарии</Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            variant="outlined"
            placeholder="Добавить комментарий..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <input
              type="file"
              onChange={handleCommentFileChange}
              style={{ display: 'none' }}
              id="comment-file-upload"
            />
            <label htmlFor="comment-file-upload">
              <IconButton component="span" size="small" title="Прикрепить файл">
                <AttachFileIcon />
              </IconButton>
            </label>

            {commentFile && (
              <Typography variant="body2">{commentFile.name}</Typography>
            )}

            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              sx={{ ml: 'auto' }}
            >
              Отправить
            </Button>
          </Box>
        </Box>

        <List>
          {comments.length === 0 && (
            <Typography variant="body2" color="text.secondary">Комментариев нет</Typography>
          )}
          {comments.map((comment) => (
            <React.Fragment key={comment.id}>
              <ListItem alignItems="flex-start">
                <Avatar sx={{ mr: 2 }}>
                  {comment.author?.username ? comment.author.username.charAt(0).toUpperCase() : '?'}
                </Avatar>
                <ListItemText
                  primary={`${comment.author?.username || 'Неизвестный'} — ${new Date(comment.created_at).toLocaleString()}`}
                  secondary={
                    <>
                      <Typography sx={{ whiteSpace: 'pre-line' }}>
                        {comment.text}
                      </Typography>
                      {comment.attachment && (
                        isImage(comment.attachment) ? (
                          <Box
                            component="img"
                            src={comment.attachment}
                            alt="attachment"
                            sx={{ maxWidth: 300, mt: 1, borderRadius: 1 }}
                          />
                        ) : (
                          <Button
                            size="small"
                            onClick={() => window.open(comment.attachment)}
                            sx={{ mt: 1 }}
                          >
                            Скачать вложение
                          </Button>
                        )
                      )}
                    </>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default BacklogItemPage;
