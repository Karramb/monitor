import React, { useEffect, useState } from 'react';
import { getHosts, getCsrfToken } from '../api';
import HostCard from '../components/HostCard';
import { Typography } from '@mui/material';

const HostListPage = () => {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        // Сначала получаем CSRF cookie с сервера
        await getCsrfToken();

        // После успешного получения CSRF можно запрашивать данные хостов
        const response = await getHosts();
        setHosts(response.data);
      } catch (error) {
        console.error('Error fetching hosts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHosts();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Серверы
      </Typography>
      {hosts.map((host) => (
        <HostCard key={host.id} host={host} />
      ))}
    </>
  );
};

export default HostListPage;
