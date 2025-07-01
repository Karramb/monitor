import React from 'react';
import { Box, CircularProgress } from '@mui/material';

export default function LoadingOverlay() {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        bgcolor: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderRadius: 1,
      }}
    >
      <CircularProgress />
    </Box>
  );
}
