import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Chip, TextField, Button,
  List, ListItem, ListItemText, Divider, Avatar, MenuItem,
  Skeleton, Autocomplete
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import axios from 'axios';

const getAccessToken = () => localStorage.getItem('token');
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getAccessToken()}`,
});

const isImage = (filename) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename);

const BacklogItemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentFiles, setCommentFiles] = useState([]);
  const [groupsMap, setGroupsMap] = useState({});
  const [tagsMap, setTagsMap] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTheme, setEditedTheme] = useState('');
  const [editedText, setEditedText] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedTags, setEditedTags] = useState([]);
  const [editedAttachments, setEditedAttachments] = useState([]);

  const statusLabels = {
    Create: 'Создана',
    Accepted: 'Принята',
    In_test: 'В тесте',
    Done: 'Выполнена',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taskRes, commentsRes, groupsRes, tagsRes, userRes] = await Promise.all([
          axios.get(`/api/backlog/${id}/`, { headers: getAuthHeaders() }),
          axios.get(`/api/backlog/${id}/comments/`, { headers: getAuthHeaders() }),
          axios.get('/api/groups/', { headers: getAuthHeaders() }),
          axios.get('/api/tags/', { headers: getAuthHeaders() }),
          axios.get('/api/users/me/', { headers: getAuthHeaders() }),
        ]);

        setTask(taskRes.data);
        setEditedTheme(taskRes.data.theme);
        setEditedText(taskRes.data.text);
        setEditedStatus(taskRes.data.status);
        setEditedTags(taskRes.data.tags || []);
        setComments(commentsRes.data);
        setCurrentUser(userRes.data);

        const groups = Object.fromEntries(groupsRes.data.map(group => [group.id, group]));
        const tags = Object.fromEntries(tagsRes.data.map(tag => [tag.id, tag]));

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

  const isAuthor = currentUser && task?.author === currentUser.username;

  const handleSaveTask = async () => {
    try {
      const formData = new FormData();
      formData.append('theme', editedTheme);
      formData.append('text', editedText);
      formData.append('status', editedStatus);
      editedTags.forEach(tagId => formData.append('tags', tagId));
      editedAttachments.forEach(file => formData.append('attachments', file));

      const response = await axios.patch(`/api/backlog/${id}/`, formData, {
        headers: getAuthHeaders(),
      });

      setTask(response.data);
      setIsEditing(false);
      setEditedAttachments([]);
    } catch (error) {
      console.error('Ошибка сохранения задачи:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditedTheme(task.theme);
    setEditedText(task.text);
    setEditedStatus(task.status);
    setEditedTags(task.tags || []);
    setEditedAttachments([]);
    setIsEditing(false);
  };

  // Важное исправление: добавляем новые файлы к уже выбранным, не заменяя полностью
  const handleCommentFileChange = (e) => {
    const files = Array.from(e.target.files);
    setCommentFiles(prev => [...prev, ...files]);
    // Очищаем input, чтобы можно было выбрать те же файлы повторно, если нужно
    e.target.value = null;
  };

  const handleEditedAttachmentsChange = (e) => {
    const files = Array.from(e.target.files);
    setEditedAttachments(prev => [...prev, ...files]);
    e.target.value = null;
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const formData = new FormData();
    formData.append('text', newComment);
    commentFiles.forEach(file => formData.append('attachments', file));

    try {
      const response = await axios.post(`/api/backlog/${id}/comments/`, formData, {
        headers: getAuthHeaders(),
      });

      setComments([response.data, ...comments]);
      setNewComment('');
      setCommentFiles([]);
    } catch (error) {
      console.error('Ошибка при отправке комментария:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 3 }} />
      </Box>
    );
  }

  if (!task) return <Typography>Задача не найдена</Typography>;

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
            <Button variant="contained" onClick={handleSaveTask}>Сохранить</Button>
            <Button onClick={handleCancelEdit}>Отмена</Button>
          </>
        ) : (
          <>
            <Typography variant="h5">{task.theme}</Typography>
            {isAuthor && (
              <Button onClick={() => setIsEditing(true)}>Редактировать</Button>
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
          <Typography sx={{ whiteSpace: 'pre-line' }}>{task.text}</Typography>
        )}

        <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box>
            <Typography>Группа:</Typography>
            <Chip label={groupsMap[task.groups]?.name || '—'} />
          </Box>

          <Box>
            <Typography>Теги:</Typography>
            {isEditing ? (
              <Autocomplete
                multiple
                options={Object.values(tagsMap)}
                getOptionLabel={(option) => option.name}
                value={Object.values(tagsMap).filter(tag => editedTags.includes(tag.id))}
                onChange={(e, value) => setEditedTags(value.map(tag => tag.id))}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={option.id}
                      label={option.name}
                      {...getTagProps({ index })}
                      sx={{ backgroundColor: option.color, color: '#000' }}
                    />
                  ))
                }
                renderInput={(params) => <TextField {...params} size="small" />}
                size="small"
                sx={{ minWidth: 200 }}
              />
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {task.tags?.map(tagId => {
                  const tag = tagsMap[tagId];
                  return tag ? (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      sx={{ backgroundColor: tag.color, color: '#000' }}
                      size="small"
                    />
                  ) : null;
                })}
              </Box>
            )}
          </Box>

          <Box>
            <Typography>Статус:</Typography>
            {isEditing ? (
              <TextField
                select
                size="small"
                value={editedStatus}
                onChange={(e) => setEditedStatus(e.target.value)}
              >
                {Object.entries(statusLabels).map(([val, label]) => (
                  <MenuItem key={val} value={val}>{label}</MenuItem>
                ))}
              </TextField>
            ) : (
              <Typography>{statusLabels[task.status]}</Typography>
            )}
          </Box>

          <Box>
            <Typography>Файлы:</Typography>
            {isEditing ? (
              <>
                <input
                  type="file"
                  multiple
                  onChange={handleEditedAttachmentsChange}
                  style={{ display: 'none' }}
                  id="edit-files"
                />
                <label htmlFor="edit-files">
                  <Button component="span" startIcon={<AttachFileIcon />}>Прикрепить</Button>
                </label>
                <Box sx={{ mt: 1 }}>
                  {editedAttachments.map((file, i) => (
                    <Typography key={i} variant="body2">{file.name}</Typography>
                  ))}
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {task.attachments?.map((att) => (
                  <Box key={att.id} sx={{ maxWidth: 100, mb: 1 }}>
                    {isImage(att.file) ? (
                      <>
                        <img
                          src={att.file}
                          alt="comment attachment"
                          style={{
                            maxWidth: '100px',
                            maxHeight: '100px',
                            objectFit: 'contain',
                            cursor: 'pointer',
                            display: 'block', // важно, чтобы заняло отдельную строку
                            marginBottom: '4px', // отступ снизу от картинки
                          }}
                          onClick={() => window.open(att.file, '_blank')}
                        />
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: '100px', wordBreak: 'break-word' }}
                          title={decodeURIComponent(att.file.split('/').pop())} // всплывающая подсказка с полным именем
                        >
                          {decodeURIComponent(att.file.split('/').pop())}
                        </Typography>
                      </>
                    ) : (
                      <a href={att.file} target="_blank" rel="noreferrer">
                        {decodeURIComponent(att.file.split('/').pop())}
                      </a>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      <Box>
        <Typography variant="h6" gutterBottom>Комментарии</Typography>

        <Box sx={{ mb: 2 }}>
          <TextField
            label="Новый комментарий"
            multiline
            minRows={2}
            fullWidth
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <input
            type="file"
            multiple
            onChange={handleCommentFileChange}
            style={{ display: 'none' }}
            id="comment-files"
          />
          <label htmlFor="comment-files">
            <Button startIcon={<AttachFileIcon />} component="span" sx={{ mt: 1 }}>
              Прикрепить файлы
            </Button>
          </label>
          <Box sx={{ mt: 1 }}>
            {commentFiles.map((file, i) => (
              <Typography key={i} variant="body2">{file.name}</Typography>
            ))}
          </Box>
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleAddComment}
            sx={{ mt: 1 }}
            disabled={!newComment.trim()}
          >
            Отправить
          </Button>
        </Box>

        <List>
          {comments.map(comment => (
            <React.Fragment key={comment.id}>
              <ListItem alignItems="flex-start">
                <Avatar sx={{ mr: 2 }}>{comment.author?.username[0].toUpperCase()}</Avatar>
                <ListItemText
                  primary={`${comment.author?.username} (${comment.created_at})`}
                  secondary={
                    <>
                      <Typography
                        sx={{ whiteSpace: 'pre-line' }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {comment.text}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {(comment.attachments || []).map(att => (
                          <Box
                            key={att.id}
                            sx={{
                              maxWidth: 100,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              mb: 1,
                              wordBreak: 'break-word', // перенос длинных имен
                            }}
                          >
                            {isImage(att.file) ? (
                              <>
                                <img
                                  src={att.file}
                                  alt="comment attachment"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '100px',
                                    objectFit: 'contain',
                                    cursor: 'pointer',
                                    display: 'block',
                                  }}
                                  onClick={() => window.open(att.file, '_blank')}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ mt: 0.5, textAlign: 'center' }}
                                  title={decodeURIComponent(att.file.split('/').pop())}
                                >
                                  {decodeURIComponent(att.file.split('/').pop())}
                                </Typography>
                              </>
                            ) : (
                              <a
                                href={att.file}
                                target="_blank"
                                rel="noreferrer"
                                style={{ wordBreak: 'break-word', textAlign: 'center', display: 'block' }}
                                title={decodeURIComponent(att.file.split('/').pop())}
                              >
                                {decodeURIComponent(att.file.split('/').pop())}
                              </a>
                            )}
                          </Box>
                        ))}

                      </Box>
                    </>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default BacklogItemPage;
