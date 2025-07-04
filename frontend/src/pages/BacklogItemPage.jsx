import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getBacklogItem,
  updateBacklogItem,
  deleteBacklogItem,
  getTags,
  getGroups
} from '../api';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const BacklogItemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [tags, setTags] = useState([]);
  const [groups, setGroups] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemData, tagsData, groupsData] = await Promise.all([
          getBacklogItem(id),
          getTags(),
          getGroups()
        ]);
        setItem(itemData);
        setTitle(itemData.title);
        setDescription(itemData.description || '');
        setSelectedTags(itemData.tags.map(tag => tag.id));
        setSelectedGroup(itemData.group?.id || null);
        setTags(tagsData);
        setGroups(groupsData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleUpdateItem = async () => {
    try {
      const updatedItem = {
        title,
        description,
        tags: selectedTags,
        group: selectedGroup
      };

      const result = await updateBacklogItem(id, updatedItem);
      setItem(result);
      setEditMode(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteItem = async () => {
    try {
      await deleteBacklogItem(id);
      navigate('/backlog');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;
  if (!item) return <Typography>Задача не найдена</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/backlog')}
        sx={{ mb: 2 }}
      >
        Назад к списку
      </Button>

      {!editMode ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h4">{item.title}</Typography>
              <Box>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                  sx={{ mr: 1 }}
                >
                  Редактировать
                </Button>
                <Button
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Удалить
                </Button>
              </Box>
            </Box>

            {item.group && (
              <Chip
                label={item.group.name}
                color="primary"
                size="small"
                sx={{ mb: 2 }}
              />
            )}

            <Typography variant="body1" paragraph>
              {item.description || 'Нет описания'}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {item.tags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Редактирование задачи
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Название задачи"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Описание"
                  multiline
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Теги</InputLabel>
                  <Select
                    multiple
                    value={selectedTags}
                    onChange={(e) => setSelectedTags(e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={tags.find(t => t.id === value)?.name || value}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {tags.map((tag) => (
                      <MenuItem key={tag.id} value={tag.id}>
                        <Checkbox checked={selectedTags.includes(tag.id)} />
                        <ListItemText primary={tag.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Группа</InputLabel>
                  <Select
                    value={selectedGroup || ''}
                    onChange={(e) => setSelectedGroup(e.target.value || null)}
                  >
                    <MenuItem value="">Без группы</MenuItem>
                    {groups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditMode(false);
                      setTitle(item.title);
                      setDescription(item.description || '');
                      setSelectedTags(item.tags.map(tag => tag.id));
                      setSelectedGroup(item.group?.id || null);
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleUpdateItem}
                    disabled={!title.trim()}
                  >
                    Сохранить
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Удалить задачу?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить задачу "{item.title}"? Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeleteItem} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BacklogItemPage;