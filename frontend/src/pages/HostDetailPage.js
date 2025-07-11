import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import HostCard from '../components/HostCard';
import { getHostDetail } from '../api';

const HostDetailPage = () => {
  const { id } = useParams();
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHost = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getHostDetail(id);
        setHost(data);
      } catch (err) {
        setError('Ошибка загрузки хоста');
      } finally {
        setLoading(false);
      }
    };
    fetchHost();
  }, [id]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;
  if (!host) return <div>Хост не найден</div>;

  return (
    <>
      <HostCard host={host} />
    </>
  );
};

export default HostDetailPage;
