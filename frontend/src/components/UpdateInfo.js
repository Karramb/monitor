import React from 'react';
import Box from '@mui/material/Box';

const UpdateInfo = ({ lastUpdate, lastCommit }) => {
  const updateDate = lastUpdate ? new Date(lastUpdate) : null;
  const commitDate = lastCommit ? new Date(lastCommit) : null;

  return (
    <Box sx={{ mb: 2, fontSize: '0.9rem' }}>
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
