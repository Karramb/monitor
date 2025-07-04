import React, { useEffect, useState } from 'react';
import { getHosts, getCsrfToken } from '../api';
import HostCard from '../components/HostCard';
import { Typography } from '@mui/material';

const HostListPage = () => {
  console.log('🏁 HostListPage отрендерен');
  const [hosts, setHosts] = useState(null); // Изначально null вместо []
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Компонент HostListPage смонтирован');
    const fetchHosts = async () => {
      try {
        await getCsrfToken();
        const data = await getHosts();
        setHosts(data); // Данные точно придут, т.к. API возвращает массив
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

  // Добавляем проверку на null/undefined
  if (!hosts) {
    return <div>Данные не загружены</div>;
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Серверы
      </Typography>
      {hosts.length > 0 ? (
        hosts.map((host) => (
          <HostCard key={host.id} host={host} />
        ))
      ) : (
        <div>Нет доступных серверов</div>
      )}
    </>
  );
};

export default HostListPage;