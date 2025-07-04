import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getBacklogItems,
  createBacklogItem,
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
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';

const BacklogPage = () => {
  const [backlogItems, setBacklogItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [items, tagsData, groupsData] = await Promise.all([
          getBacklogItems(),
          getTags(),
          getGroups()
        ]);
        setBacklogItems(items);
        setFilteredItems(items);
        setTags(tagsData);
        setGroups(groupsData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...backlogItems];

    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        item.tags.some(tag => selectedTags.includes(tag.id))
      );
    }

    if (selectedGroups.length > 0) {
      filtered = filtered.filter(item =>
        selectedGroups.includes(item.group?.id)
      );
    }

    setFilteredItems(filtered);
  }, [backlogItems, selectedTags, selectedGroups]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleCreateItem = async () => {
    if (!newItemTitle.trim()) return;

    try {
      const newItem = {
        title: newItemTitle,
        description: newItemDescription,
        tags: selectedTags,
        group: selectedGroups.length > 0 ? selectedGroups[0] : null
      };

      const createdItem = await createBacklogItem(newItem);
      setBacklogItems([...backlogItems, createdItem]);
      setNewItemTitle('');
      setNewItemDescription('');
      setSelectedTags([]);
      setSelectedGroups([]);
      setShowCreateForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleItemClick = (id) => {
    navigate(`/backlog/${id}`);
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Бэклог задач</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Фильтры
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            Новая задача
          </Button>
        </Stack>
      </Box>

      {showFilters && (
        <Card sx={{ mb: 3, p: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Фильтры
            </Typography>
            <Grid container spacing={2}>
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
                  <InputLabel>Группы</InputLabel>
                  <Select
                    multiple
                    value={selectedGroups}
                    onChange={(e) => setSelectedGroups(e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={groups.find(g => g.id === value)?.name || value}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {groups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        <Checkbox checked={selectedGroups.includes(group.id)} />
                        <ListItemText primary={group.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {showCreateForm && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Создать новую задачу
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Название задачи"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Описание"
                  multiline
                  rows={3}
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
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
                    value={selectedGroups.length > 0 ? selectedGroups[0] : ''}
                    onChange={(e) => setSelectedGroups(e.target.value ? [e.target.value] : [])}
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
                      setShowCreateForm(false);
                      setNewItemTitle('');
                      setNewItemDescription('');
                      setSelectedTags([]);
                      setSelectedGroups([]);
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleCreateItem}
                    disabled={!newItemTitle.trim()}
                  >
                    Создать
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {filteredItems.length === 0 ? (
          <Grid item xs={12}>
            <Typography>Задачи не найдены</Typography>
          </Grid>
        ) : (
          filteredItems.map((item) => (
            <Grid item xs={12} key={item.id}>
              <Card
                onClick={() => handleItemClick(item.id)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">{item.title}</Typography>
                    {item.group && (
                      <Chip
                        label={item.group.name}
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>
                  <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                    {item.description && item.description.length > 100
                      ? `${item.description.substring(0, 100)}...`
                      : item.description}
                  </Typography>
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
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default BacklogPage;
