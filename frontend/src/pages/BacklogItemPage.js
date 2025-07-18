import React from 'react';
import {
  Box, Typography, Paper, Chip, TextField, Button,
  List, ListItem, ListItemText, Divider, Avatar, MenuItem,
  Skeleton, Autocomplete, Stack, Fade, IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CommentIcon from '@mui/icons-material/Comment';
import useBacklogItem from '../hooks/useBacklogItem';
import { styled, keyframes } from '@mui/material/styles';

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

const staggeredFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Анимации
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(25, 118, 210, 0); }
  100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
`;

// Стилизованные компоненты
const MainContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 1200,
  margin: '0 auto',
  animation: `${fadeInUp} 0.6s ease-out`,
  background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[50]} 100%)`,
  minHeight: '100vh',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '200px',
    background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}08 100%)`,
    borderRadius: '0 0 50px 50px',
    zIndex: -1,
  }
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 3,
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 25px ${theme.palette.primary.main}20`,
    '&::before': {
      transform: 'translateX(0)',
    }
  },
}));

const CommentPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[25]} 100%)`,
  marginBottom: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: '0 4px 4px 0',
  },
  '&:hover': {
    transform: 'translateX(2px)',
    boxShadow: `0 4px 20px ${theme.palette.primary.main}15`,
  },
}));

const AttachmentPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius * 2,
  position: 'relative',
  maxWidth: 150,
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}20, transparent)`,
    transition: 'left 0.5s ease',
  },
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: `0 6px 20px ${theme.palette.primary.main}25`,
    '&::before': {
      left: '100%',
    }
  },
}));

const EnhancedChip = styled(Chip)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '0.875rem',
  height: 36,
  borderRadius: theme.shape.borderRadius * 3,
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    transition: 'left 0.5s ease',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 12px ${theme.palette.primary.main}30`,
    '&::before': {
      left: '100%',
    }
  },
}));

const TagChip = styled(Chip)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '0.8125rem',
  height: 32,
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    transition: 'left 0.5s ease',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 12px ${theme.palette.grey[400]}50`,
    '&::before': {
      left: '100%',
    }
  },
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  fontWeight: 600,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    transition: 'left 0.5s ease',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
    '&::before': {
      left: '100%',
    }
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

const EnhancedAvatar = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  marginRight: theme.spacing(2),
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  fontSize: '1.2rem',
  fontWeight: 'bold',
  transition: 'all 0.3s ease',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: '50%',
    zIndex: -1,
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover': {
    transform: 'scale(1.1)',
    '&::before': {
      opacity: 0.3,
    }
  },
}));

const GlowingTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius * 2,
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: `0 0 0 1px ${theme.palette.primary.main}30`,
    },
    '&.Mui-focused': {
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`,
    },
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.5rem',
  marginBottom: theme.spacing(2),
  position: 'relative',
  display: 'inline-block',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -4,
    left: 0,
    width: '100%',
    height: '3px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: '2px',
    transform: 'scaleX(0)',
    transformOrigin: 'left',
    transition: 'transform 0.3s ease',
  },
  '&:hover::after': {
    transform: 'scaleX(1)',
  },
}));

const LoadingSkeleton = styled(Skeleton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  background: `linear-gradient(90deg, ${theme.palette.grey[200]} 0%, ${theme.palette.grey[100]} 50%, ${theme.palette.grey[200]} 100%)`,
  backgroundSize: '200px 100%',
  animation: `${shimmer} 1.5s ease-in-out infinite`,
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
      <MainContainer>
        <LoadingSkeleton variant="rectangular" width="100%" height={56} sx={{ mb: 3 }} />
        <LoadingSkeleton variant="rectangular" width="100%" height={200} sx={{ mb: 3 }} />
        <LoadingSkeleton variant="rectangular" width="100%" height={150} />
      </MainContainer>
    );
  }

  if (!task) {
    return (
      <MainContainer>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <TaskAltIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            Задача не найдена
          </Typography>
        </Box>
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      {/* Заголовок и редактирование темы */}
      <Fade in timeout={600}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          {isEditing ? (
            <>
              <GlowingTextField
                label="Тема"
                value={editedTheme}
                onChange={(e) => setEditedTheme(e.target.value)}
                size="small"
                sx={{ flex: 1, mr: 2 }}
                variant="outlined"
              />
              <Stack direction="row" spacing={2}>
                <AnimatedButton 
                  variant="contained" 
                  onClick={handleSaveTask}
                  color="primary"
                  sx={{ minWidth: 120 }}
                >
                  Сохранить
                </AnimatedButton>
                <AnimatedButton 
                  onClick={handleCancelEdit}
                  variant="outlined"
                  color="inherit"
                >
                  Отмена
                </AnimatedButton>
              </Stack>
            </>
          ) : (
            <>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {task.theme}
              </Typography>
              {isAuthor && (
                <AnimatedButton 
                  onClick={() => setIsEditing(true)}
                  startIcon={<EditIcon />}
                  variant="outlined"
                  color="primary"
                  sx={{ animation: `${pulse} 2s infinite` }}
                >
                  Редактировать
                </AnimatedButton>
              )}
            </>
          )}
        </Stack>
      </Fade>

      {/* Статус и теги */}
      <Fade in timeout={800}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          {isEditing ? (
            <Stack direction="row" spacing={3} sx={{ width: '100%' }}>
              <GlowingTextField
                select
                label="Статус"
                value={editedStatus}
                onChange={(e) => setEditedStatus(e.target.value)}
                size="small"
                sx={{ width: 220 }}
                variant="outlined"
              >
                {Object.entries(statusLabels).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </GlowingTextField>
              <Autocomplete
                multiple
                options={Object.values(tagsMap)}
                getOptionLabel={(option) => option.name}
                value={editedTags.map(tagId => tagsMap[tagId]).filter(Boolean)}
                onChange={(e, newValue) => setEditedTags(newValue.map(t => t.id))}
                sx={{ flex: 1 }}
                size="small"
                renderInput={(params) => (
                  <GlowingTextField 
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
              <EnhancedChip
                label={statusLabels[task.status]}
                color={statusColors[task.status]}
                icon={<TaskAltIcon />}
              />

              {/* Теги */}
              {(task.tags || []).map((tagId, index) => {
                const tag = tagsMap[tagId];
                if (!tag) return null;
                return (
                  <TagChip
                    key={tagId}
                    label={tag.name}
                    sx={{
                      backgroundColor: tag.color,
                      color: '#000',
                      animation: `${staggeredFadeIn} 0.6s ease-out ${index * 0.1}s both`,
                    }}
                  />
                );
              })}
            </>
          )}
        </Box>
      </Fade>

      {/* Текст задачи */}
      <Fade in timeout={1000}>
        <StyledPaper variant="outlined" sx={{ mb: 4 }}>
          {isEditing ? (
            <GlowingTextField
              multiline
              rows={6}
              fullWidth
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              variant="outlined"
            />
          ) : (
            <Typography 
              variant="body1" 
              sx={{ 
                lineHeight: 1.7,
                fontSize: '1.1rem',
                color: 'text.primary',
              }}
            >
              {task.text}
            </Typography>
          )}
        </StyledPaper>
      </Fade>

      {/* Вложения */}
      <Fade in timeout={1200}>
        <Box sx={{ mb: 5 }}>
          <SectionTitle variant="h5" component="h2">
            Вложения
          </SectionTitle>
          
          {isEditing && (
            <AnimatedButton 
              variant="outlined" 
              component="label" 
              startIcon={<AttachFileIcon />}
              sx={{ mb: 3 }}
            >
              Добавить файлы
              <input
                type="file"
                hidden
                multiple
                onChange={handleEditedAttachmentsChange}
              />
            </AnimatedButton>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {(task.attachments || []).map((file, index) => (
              <AttachmentPaper 
                key={file.id} 
                elevation={0}
                sx={{
                  animation: `${staggeredFadeIn} 0.6s ease-out ${index * 0.1}s both`,
                }}
              >
                {isImage(file.file) ? (
                  <img
                    src={file.file}
                    alt={file.filename}
                    style={{ 
                      width: '100%', 
                      cursor: 'pointer',
                      borderRadius: 8,
                      transition: 'transform 0.3s ease',
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
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline',
                      }
                    }}
                  >
                    {file.filename}
                  </Typography>
                )}

                {isEditing && !filesToDelete.includes(file.id) && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteFile(file.id)}
                    sx={{ 
                      position: 'absolute', 
                      top: 4, 
                      right: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}

                {isEditing && filesToDelete.includes(file.id) && (
                  <AnimatedButton
                    size="small"
                    color="success"
                    onClick={() => handleCancelDeleteFile(file.id)}
                    sx={{ 
                      position: 'absolute', 
                      top: 4, 
                      right: 4,
                      minWidth: 0,
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    Отмена
                  </AnimatedButton>
                )}
              </AttachmentPaper>
            ))}

            {/* Новые добавленные файлы */}
            {editedAttachments.map((file, idx) => (
              <AttachmentPaper 
                key={`new-${idx}`} 
                elevation={0}
                sx={{
                  animation: `${staggeredFadeIn} 0.6s ease-out`,
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{
                    display: 'block',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                    color: 'primary.main',
                  }}
                >
                  {file.name}
                </Typography>
              </AttachmentPaper>
            ))}
          </Box>
        </Box>
      </Fade>

      {/* Комментарии */}
      <Fade in timeout={1400}>
        <Box>
          <SectionTitle variant="h5" component="h2">
            <CommentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Комментарии
          </SectionTitle>

          {/* Добавление комментария */}
          <CommentPaper elevation={0}>
            <GlowingTextField
              multiline
              rows={3}
              fullWidth
              placeholder="Напишите комментарий..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              variant="outlined"
            />
            <Stack direction="row" spacing={2} sx={{ mt: 2 }} alignItems="center">
              <AnimatedButton
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
              </AnimatedButton>

              {/* Файлы вложений в комментарии */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flex: 1 }}>
                {commentFiles.map((file, idx) => (
                  <EnhancedChip
                    key={`comment-file-${idx}`}
                    label={file.name}
                    size="small"
                    sx={{
                      animation: `${staggeredFadeIn} 0.6s ease-out`,
                    }}
                    onDelete={() => {
                      const newFiles = [...commentFiles];
                      newFiles.splice(idx, 1);
                      setCommentFiles(newFiles);
                    }}
                  />
                ))}
              </Box>

              <AnimatedButton
                variant="contained"
                endIcon={<SendIcon />}
                onClick={handleAddComment}
                sx={{ minWidth: 120 }}
              >
                Отправить
              </AnimatedButton>
            </Stack>
          </CommentPaper>

          {/* Список комментариев */}
          <List disablePadding>
            {comments.map((comment, index) => (
              <React.Fragment key={comment.id}>
                <ListItem 
                  alignItems="flex-start" 
                  sx={{ 
                    px: 0, 
                    py: 2,
                    animation: `${staggeredFadeIn} 0.6s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <EnhancedAvatar>
                    {comment.author?.username[0]?.toUpperCase()}
                  </EnhancedAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="baseline">
                        <Typography 
                          variant="subtitle1" 
                          sx={{ fontWeight: 700 }}
                        >
                          {comment.author?.username}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="textSecondary"
                          sx={{ fontWeight: 500 }}
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
                            mt: 1,
                            lineHeight: 1.6,
                            fontSize: '0.95rem',
                          }}
                        >
                          {comment.text}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {(comment.attachments || []).map((file, fileIndex) => (
                            <Box 
                              key={file.id}
                              sx={{
                                animation: `${staggeredFadeIn} 0.6s ease-out ${fileIndex * 0.05}s both`,
                              }}
                            >
                              {isImage(file.file) ? (
                                <img
                                  src={file.file}
                                  alt={file.filename}
                                  style={{ 
                                    maxWidth: 100, 
                                    maxHeight: 100,
                                    cursor: 'pointer',
                                    borderRadius: 8,
                                    transition: 'transform 0.3s ease',
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
                                    display: 'inline-block',
                                    color: 'primary.main',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: 'primary.light',
                                    '&:hover': {
                                      textDecoration: 'underline',
                                      backgroundColor: 'primary.main',
                                      color: 'white',
                                    }
                                  }}
                                >
                                  {file.filename}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      </>
                    }
                  />
                </ListItem>
                <Divider 
                  component="li" 
                  sx={{ 
                    my: 2,
                    background: `linear-gradient(90deg, transparent, ${theme => theme.palette.divider}, transparent)`,
                  }} 
                />
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Fade>
    </MainContainer>
  );
};

export default BacklogItemPage;