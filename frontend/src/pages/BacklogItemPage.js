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
import axios from 'axios';

const BacklogItemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const [taskRes, commentsRes] = await Promise.all([
          axios.get(`/api/backlog/${id}/`),
          axios.get(`/api/backlog/${id}/comments/`)
        ]);
        setTask(taskRes.data);
        setStatus(taskRes.data.status);
        setComments(commentsRes.data);
      } catch (error) {
        console.error('Ошибка при загрузке задачи:', error);
        navigate('/backlog');
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id, navigate]);

  const handleStatusChange = async () => {
    try {
      await axios.patch(`/api/backlog/${id}/`, { status });
    } catch (error) {
      console.error('Ошибка при изменении статуса:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const response = await axios.post(`/api/backlog/${id}/add_comment/`, {
        text: newComment
      });
      setComments([...comments, response.data]);
      setNewComment('');
    } catch (error) {
      console.error('Ошибка при добавлении комментария:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 3 }} />
      </Box>
    );
  }

  if (!task) return <Typography>Задача не найдена</Typography>;

  return (
    <Box sx={{ 
      p: 4,
      maxWidth: '100%',
      width: '100vw',
      margin: 0,
      minHeight: '100vh'
    }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, mb: 3 }}>
        {task.theme}
      </Typography>
      
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
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          size="small"
        >
          <MenuItem value="open">Открыта</MenuItem>
          <MenuItem value="in_progress">В работе</MenuItem>
          <MenuItem value="closed">Закрыта</MenuItem>
        </TextField>
        <Button 
          variant="contained" 
          onClick={handleStatusChange}
          size="small"
          sx={{ height: 40 }}
        >
          Обновить
        </Button>
      </Box>

      <Paper sx={{ 
        p: 3, 
        mb: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none'
      }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
          Описание
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          {task.text}
        </Typography>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>Теги:</Typography>
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
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>Группа:</Typography>
            <Chip 
              label={task.groups.name} 
              size="small" 
              sx={{ 
                height: 24,
                fontSize: '0.75rem'
              }} 
            />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ 
        p: 3, 
        mb: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none'
      }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
          Комментарии
        </Typography>
        
        <List dense sx={{ 
          '& .MuiListItem-root': {
            px: 0,
            py: 1.5
          }
        }}>
          {comments.map((comment, index) => (
            <React.Fragment key={comment.id}>
              <ListItem alignItems="flex-start">
                <Avatar sx={{ 
                  mr: 2,
                  width: 32,
                  height: 32,
                  fontSize: '0.875rem'
                }}>
                  {comment.author.username.charAt(0).toUpperCase()}
                </Avatar>
                <ListItemText
                  primary={
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                        {comment.author.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comment.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {comment.text}
                    </Typography>
                  }
                  sx={{ 
                    '& .MuiListItemText-primary': {
                      mb: 0.5
                    }
                  }}
                />
              </ListItem>
              {index < comments.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            variant="outlined"
            placeholder="Добавить комментарий..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            sx={{ alignSelf: 'flex-end' }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default BacklogItemPage;