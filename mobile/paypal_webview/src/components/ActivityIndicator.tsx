import {CircularProgress} from '@mui/material';
import React from 'react';
import VerticallyCenteringView from './VerticallyCenteringView';

const ActivityIndicator = () => {
  return (
    <VerticallyCenteringView>
      <CircularProgress
        size={25}
        sx={{
          animationDuration: '5s',
          color: 'black',
        }}
      />
    </VerticallyCenteringView>
  );
};

export default ActivityIndicator;
