import React from 'react';
import {
  Box, Typography, Paper, Chip, TextField, Button,
  List, ListItem, ListItemText, Divider, Avatar, MenuItem,
  Skeleton, Autocomplete, Stack
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import useBacklogItem from '../hooks/useBacklogItem';
import { styled } from '@mui/material/styles';

const isImage = (filename) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename);

const statusLabels = {
  Create: 'Создана',
  Accepted: 'Принята',
  In_test: 'В тесте',
  Done: 'Выполнена',
};

const statusColors = {
  Create: 'default',
  Accepted: 'info',
  In_test: 'warning',
  Done: 'success',
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const CommentPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.grey[50],
  marginBottom: theme.spacing(3),
}));

const AttachmentPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  position: 'relative',
  maxWidth: 150,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[2],
  },
}));

const BacklogItemPage = () => {
  const {
    task,
    comments,
    newComment,
    commentFiles,
    tagsMap,
    loading,

    isEditing,
    editedTheme,
    editedText,
    editedStatus,
    editedTags,
    editedAttachments,
    filesToDelete,

    isAuthor,

    setNewComment,
    setCommentFiles,
    setIsEditing,
    setEditedTheme,
    setEditedText,
    setEditedStatus,
    setEditedTags,

    handleDeleteFile,
    handleCancelDeleteFile,
    handleSaveTask,
    handleCancelEdit,
    handleCommentFileChange,
    handleEditedAttachmentsChange,
    handleAddComment,
  } = useBacklogItem();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 3, borderRadius: 2 }} />
      </Box>
    );
  }

  if (!task) return <Typography variant="h6" color="textSecondary">Задача не найдена</Typography>;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      {/* Заголовок и редактирование темы */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        {isEditing ? (
          <>
            <TextField
              label="Тема"
              value={editedTheme}
              onChange={(e) => setEditedTheme(e.target.value)}
              size="small"
              sx={{ flex: 1, mr: 2 }}
              variant="outlined"
            />
            <Stack direction="row" spacing={1}>
              <Button 
                variant="contained" 
                onClick={handleSaveTask}
                color="primary"
                sx={{ minWidth: 120 }}
              >
                Сохранить
              </Button>
              <Button 
                onClick={handleCancelEdit}
                variant="outlined"
                color="inherit"
              >
                Отмена
              </Button>
            </Stack>
          </>
        ) : (
          <>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              {task.theme}
            </Typography>
            {isAuthor && (
              <Button 
                onClick={() => setIsEditing(true)}
                startIcon={<EditIcon />}
                variant="outlined"
                color="primary"
              >
                Редактировать
              </Button>
            )}
          </>
        )}
      </Stack>

      {/* Статус и теги */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        {isEditing ? (
          <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
            <TextField
              select
              label="Статус"
              value={editedStatus}
              onChange={(e) => setEditedStatus(e.target.value)}
              size="small"
              sx={{ width: 200 }}
              variant="outlined"
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </TextField>
            <Autocomplete
              multiple
              options={Object.values(tagsMap)}
              getOptionLabel={(option) => option.name}
              value={editedTags.map(tagId => tagsMap[tagId]).filter(Boolean)}
              onChange={(e, newValue) => setEditedTags(newValue.map(t => t.id))}
              sx={{ flex: 1 }}
              size="small"
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Теги" 
                  variant="outlined" 
                />
              )}
            />
          </Stack>
        ) : (
          <>
            {/* Статус */}
            <Chip
              label={statusLabels[task.status]}
              color={statusColors[task.status]}
              sx={{ 
                fontWeight: 'bold', 
                mr: 1, 
                fontSize: '0.875rem',
                height: 32,
              }}
            />

            {/* Теги */}
            {(task.tags || []).map(tagId => {
              const tag = tagsMap[tagId];
              if (!tag) return null;
              return (
                <Chip
                  key={tagId}
                  label={tag.name}
                  sx={{
                    backgroundColor: tag.color,
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '0.8125rem',
                    height: 28,
                  }}
                />
              );
            })}
          </>
        )}
      </Box>

      {/* Текст задачи */}
      <StyledPaper variant="outlined" sx={{ mb: 3 }}>
        {isEditing ? (
          <TextField
            multiline
            rows={6}
            fullWidth
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            variant="outlined"
          />
        ) : (
          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
            {task.text}
          </Typography>
        )}
      </StyledPaper>

      {/* Вложения */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Вложения:</Typography>
        {isEditing && (
          <Button 
            variant="outlined" 
            component="label" 
            startIcon={<AttachFileIcon />}
            sx={{ mb: 2 }}
          >
            Добавить файлы
            <input
              type="file"
              hidden
              multiple
              onChange={handleEditedAttachmentsChange}
            />
          </Button>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {(task.attachments || []).map(file => (
            <AttachmentPaper 
              key={file.id}
              elevation={1}
            >
              {isImage(file.file) ? (
                <img
                  src={file.file}
                  alt={file.filename}
                  style={{ 
                    width: '100%', 
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                  onClick={() => window.open(file.file, '_blank')}
                />
              ) : (
                <Typography 
                  variant="caption" 
                  component="a" 
                  href={file.file} 
                  target="_blank" 
                  rel="noreferrer"
                  sx={{
                    display: 'block',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  {file.filename}
                </Typography>
              )}

              {isEditing && !filesToDelete.includes(file.id) && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDeleteFile(file.id)}
                  sx={{ 
                    position: 'absolute', 
                    top: 4, 
                    right: 4,
                    minWidth: 0,
                    padding: 0.5,
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </Button>
              )}

              {isEditing && filesToDelete.includes(file.id) && (
                <Button
                  size="small"
                  color="success"
                  onClick={() => handleCancelDeleteFile(file.id)}
                  sx={{ 
                    position: 'absolute', 
                    top: 4, 
                    right: 4,
                    minWidth: 0,
                    padding: '2px 4px',
                    fontSize: '0.75rem',
                  }}
                >
                  Отмена
                </Button>
              )}
            </AttachmentPaper>
          ))}

          {/* Новые добавленные файлы */}
          {editedAttachments.map((file, idx) => (
            <AttachmentPaper key={`new-${idx}`} elevation={1}>
              <Typography 
                variant="caption" 
                sx={{
                  display: 'block',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.name}
              </Typography>
            </AttachmentPaper>
          ))}
        </Box>
      </Box>

      {/* Комментарии */}
      <Box>
        <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>Комментарии</Typography>

        {/* Добавление комментария */}
        <CommentPaper elevation={0}>
          <TextField
            multiline
            rows={3}
            fullWidth
            placeholder="Напишите комментарий..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            variant="outlined"
          />
          <Stack direction="row" spacing={2} sx={{ mt: 2 }} alignItems="center">
            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFileIcon />}
              size="small"
            >
              Добавить вложения
              <input
                type="file"
                hidden
                multiple
                onChange={handleCommentFileChange}
              />
            </Button>

            {/* Файлы вложений в комментарии */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flex: 1 }}>
              {commentFiles.map((file, idx) => (
                <Chip
                  key={`comment-file-${idx}`}
                  label={file.name}
                  size="small"
                  onDelete={() => {
                    const newFiles = [...commentFiles];
                    newFiles.splice(idx, 1);
                    setCommentFiles(newFiles);
                  }}
                />
              ))}
            </Box>

            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleAddComment}
              sx={{ minWidth: 120 }}
            >
              Отправить
            </Button>
          </Stack>
        </CommentPaper>

        {/* Список комментариев */}
        <List disablePadding>
          {comments.map(comment => (
            <React.Fragment key={comment.id}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main',
                  width: 40,
                  height: 40,
                  mr: 2,
                }}>
                  {comment.author?.username[0]?.toUpperCase()}
                </Avatar>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="baseline">
                      <Typography 
                        variant="subtitle1" 
                        sx={{ fontWeight: 600 }}
                      >
                        {comment.author?.username}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="textSecondary"
                      >
                        {new Date(comment.created_at).toLocaleString()}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          mt: 0.5,
                          lineHeight: 1.5,
                        }}
                      >
                        {comment.text}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {(comment.attachments || []).map(file => (
                          isImage(file.file) ? (
                            <img
                              key={file.id}
                              src={file.file}
                              alt={file.filename}
                              style={{ 
                                maxWidth: 100, 
                                maxHeight: 100,
                                cursor: 'pointer',
                                borderRadius: 4,
                              }}
                              onClick={() => window.open(file.file, '_blank')}
                            />
                          ) : (
                            <Typography
                              key={file.id}
                              variant="caption"
                              component="a"
                              href={file.file}
                              target="_blank"
                              rel="noreferrer"
                              sx={{
                                display: 'inline-block',
                                color: 'primary.main',
                                textDecoration: 'none',
                                '&:hover': {
                                  textDecoration: 'underline',
                                }
                              }}
                            >
                              {file.filename}
                            </Typography>
                          )
                        ))}
                      </Box>
                    </>
                  }
                />
              </ListItem>
              <Divider component="li" sx={{ my: 2 }} />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default BacklogItemPage;