import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getHostDetail, runScript } from '../api'; // Добавляем импорт runScript
import Layout from '../components/Layout';
import { Typography, Box, Button } from '@mui/material';

const HostDetailPage = () => {
  const { id } = useParams();
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHost = async () => {
      try {
        const response = await getHostDetail(id);
        setHost(response.data);
      } catch (error) {
        console.error('Error fetching host:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHost();
  }, [id]);

  if (loading) {
    return <Layout>Loading...</Layout>;
  }

  if (!host) {
    return <Layout>Host not found</Layout>;
  }

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        {host.name}
      </Typography>
      <Typography variant="body1" gutterBottom>
        <strong>Hostname:</strong> {host.hostname}
      </Typography>
      <Typography variant="body1" gutterBottom>
        <strong>Port:</strong> {host.port}
      </Typography>
      <Typography variant="body1" gutterBottom>
        <strong>Status:</strong> {host.is_active ? 'Active' : 'Inactive'}
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Actions
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => runScript(host.id, 'backup')}
          sx={{ mr: 2 }}
        >
          Run Backup
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => runScript(host.id, 'restart')}
        >
          Restart Services
        </Button>
      </Box>
    </Layout>
  );
};

export default HostDetailPage;