import React from 'react';
import AppLayout from '@/components/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import { EMISProvider } from '@/contexts/EMISContext';

const Index: React.FC = () => {
  return (
    <AppProvider>
      <EMISProvider>
        <AppLayout />
      </EMISProvider>
    </AppProvider>
  );
};

export default Index;
