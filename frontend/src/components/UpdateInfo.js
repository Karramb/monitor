import React from 'react';
import Box from '@mui/material/Box';

const UpdateInfo = ({ lastUpdate, lastCommit, commitHash }) => {
  const updateDate = lastUpdate ? new Date(lastUpdate) : null;
  const commitDate = lastCommit ? new Date(lastCommit) : null;

  return (
    <Box sx={{ mb: 2, fontSize: '0.9rem' }}>
      {/* Commit hash в стиле GitLab */}
      {commitHash && (
        <Box sx={{ 
          mb: 1.5, 
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 8px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #e9ecef'
        }}>
          <Box sx={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '3px',
            fontWeight: 'bold'
          }}>
            {commitHash.substring(0, 8)}
          </Box>
        </Box>
      )}

      {/* Даты обновлений */}
      {updateDate && commitDate ? (
        <>
          <div style={{ color: updateDate > commitDate ? 'black' : 'gray' }}>
            Последнее обновление: {updateDate.toLocaleString()}
          </div>
          <div style={{ color: commitDate > updateDate ? 'black' : 'gray' }}>
            Дата последнего коммита: {commitDate.toLocaleString()}
          </div>
        </>
      ) : (
        <>
          {updateDate && (
            <div style={{ color: 'black' }}>
              Последнее обновление: {updateDate.toLocaleString()}
            </div>
          )}
          {commitDate && (
            <div style={{ color: 'black' }}>
              Дата последнего коммита: {commitDate.toLocaleString()}
            </div>
          )}
        </>
      )}
    </Box>
  );
};

export default UpdateInfo;