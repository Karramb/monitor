// src/pages/BacklogPage.js
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid,
  Box
} from '@mui/material';
import { getBacklogs, getGroups, getTags } from '../api';

const BacklogPage = () => {
  const [backlogs, setBacklogs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [backlogsData, groupsData, tagsData] = await Promise.all([
          getBacklogs(),
          getGroups(),
          getTags()
        ]);
        setBacklogs(backlogsData);
        setGroups(groupsData);
        setTags(tagsData);
        setLoading(false);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredBacklogs = backlogs.filter(backlog => {
    const groupMatch = selectedGroup ? backlog.groups.id === selectedGroup : true;
    const tagMatch = selectedTag ? backlog.tags.some(tag => tag.id === selectedTag) : true;
    return groupMatch && tagMatch;
  });

  if (loading) {
    return (
      <Container>
        <Typography variant="h6">Загрузка данных...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Бэклог задач
      </Typography>

      {/* Фильтры */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Группа</InputLabel>
          <Select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            label="Группа"
          >
            <MenuItem value="">Все группы</MenuItem>
            {groups.map(group => (
              <MenuItem key={group.id} value={group.id}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Тег</InputLabel>
          <Select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            label="Тег"
          >
            <MenuItem value="">Все теги</MenuItem>
            {tags.map(tag => (
              <MenuItem key={tag.id} value={tag.id}>
                {tag.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Список задач */}
      <Grid container spacing={3}>
        {filteredBacklogs.length === 0 ? (
          <Grid item xs={12}>
            <Typography>Задачи не найдены</Typography>
          </Grid>
        ) : (
          filteredBacklogs.map(backlog => (
            <Grid item xs={12} key={backlog.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="div">
                    {backlog.theme}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Автор: {backlog.author.username}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {backlog.text}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Chip 
                      label={backlog.groups.name} 
                      color="primary" 
                      size="small" 
                    />
                    {backlog.tags.map(tag => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        sx={{ backgroundColor: tag.color, color: 'white' }}
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