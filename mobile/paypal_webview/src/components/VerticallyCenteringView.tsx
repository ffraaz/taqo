import React from 'react';

interface Props {
  children: React.ReactNode;
}

const VerticallyCenteringView = ({children}: Props) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}>
      {children}
    </div>
  );
};

export default VerticallyCenteringView;
