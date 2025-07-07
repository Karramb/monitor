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
  const [loading, setLoading] = useState(true);
  const [commentFile, setCommentFile] = useState(null);
  const [groupsMap, setGroupsMap] = useState({});
  const [tagsMap, setTagsMap] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTheme, setEditedTheme] = useState('');
  const statusLabels = {
    Create: 'Создана',
    Accepted: 'Принята',
    In_test: 'В тесте',
    Done: 'Выполнена',
  };
  const [editedText, setEditedText] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedAttachment, setEditedAttachment] = useState(null);

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
        setEditedText(taskRes.data.text);
        setEditedStatus(taskRes.data.status);
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

  const handleSaveTask = async () => {
    try {
      const formData = new FormData();
      formData.append('theme', editedTheme);
      formData.append('text', editedText);
      formData.append('status', editedStatus);
      if (editedAttachment) {
        formData.append('attachment', editedAttachment);
      }

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
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка сохранения задачи:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditedTheme(task.theme);
    setEditedText(task.text);
    setEditedStatus(task.status);
    setEditedAttachment(null);
    setIsEditing(false);
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
      console.error('Ошибка при отправке комментария:', error.response?.data);
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        {isEditing ? (
          <>
            <TextField
              label="Тема"
              value={editedTheme}
              onChange={(e) => setEditedTheme(e.target.value)}
              size="small"
              sx={{ flex: 1, mr: 2 }}
            />
            <Button variant="contained" size="small" onClick={handleSaveTask}>Сохранить</Button>
            <Button size="small" onClick={handleCancelEdit}>Отмена</Button>
          </>
        ) : (
          <>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              {task.theme}
            </Typography>
            {isAuthor && (
              <Button size="small" onClick={() => setIsEditing(true)}>
                Редактировать
              </Button>
            )}
          </>
        )}
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Описание</Typography>
        {isEditing ? (
          <TextField
            fullWidth
            multiline
            minRows={4}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
        ) : (
          <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>{task.text}</Typography>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
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
                    sx={{ backgroundColor: tag.color, color: '#fff', fontSize: '0.7rem' }}
                  />
                ) : null;
              })}
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>Статус:</Typography>
            {isEditing ? (
              <TextField
                select
                size="small"
                value={editedStatus}
                onChange={(e) => setEditedStatus(e.target.value)}
              >
                <MenuItem value="Create">Создана</MenuItem>
                <MenuItem value="Accepted">Принята</MenuItem>
                <MenuItem value="In_test">В тесте</MenuItem>
                <MenuItem value="Done">Выполнена</MenuItem>
              </TextField>
            ) : (
              <Typography>{statusLabels[task.status] || task.status}</Typography>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>Файл:</Typography>
            {isEditing ? (
              <>
                {task.attachment && !editedAttachment && (
                  <Button
                    size="small"
                    onClick={() => window.open(task.attachment)}
                  >
                    Текущий файл
                  </Button>
                )}
                <input
                  type="file"
                  onChange={(e) => setEditedAttachment(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="edit-attachment"
                />
                <label htmlFor="edit-attachment">
                  <Button component="span" size="small" startIcon={<AttachFileIcon />}>
                    {editedAttachment ? 'Заменить файл' : 'Прикрепить файл'}
                  </Button>
                </label>
                {editedAttachment && (
                  <Typography variant="body2">{editedAttachment.name}</Typography>
                )}
              </>
            ) : (
              task.attachment ? (
                <Button size="small" onClick={() => window.open(task.attachment)}>
                  Скачать
                </Button>
              ) : (
                <Typography variant="body2" color="text.secondary">Нет файла</Typography>
              )
            )}
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
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
