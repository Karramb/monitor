import React, { useEffect, useState } from 'react';
import { getHosts, getCsrfToken } from '../api';
import HostCard from '../components/HostCard';
import { Typography, Box } from '@mui/material'; // Добавляем Box

const HostListPage = () => {
  console.log('🏁 HostListPage отрендерен');
  const [hosts, setHosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Компонент HostListPage смонтирован');
    const fetchHosts = async () => {
      try {
        await getCsrfToken();
        const data = await getHosts();
        setHosts(data);
      } catch (err) {
        console.error('Error fetching hosts:', err);
        setError('Ошибка загрузки серверов');
      } finally {
        setLoading(false);
      }
    };

    fetchHosts();
  }, []);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!hosts) {
    return <div>Данные не загружены</div>;
  }

  return (
    <Box sx={{ p: 3 }}> {/* Добавляем отступы */}
      <Typography variant="h4" gutterBottom>
        Серверы
      </Typography>
      <Box sx={{ 
        display: 'flex',
        flexWrap: 'wrap', // Перенос на новую строку при нехватке места
        gap: 2, // Отступ между карточками
        justifyContent: 'flex-start' // Выравнивание по левому краю
      }}>
        {hosts.length > 0 ? (
          hosts.map((host) => (
            <HostCard key={host.id} host={host} />
          ))
        ) : (
          <Typography>Нет доступных серверов</Typography>
        )}
      </Box>
    </Box>
  );
};

export default HostListPage;