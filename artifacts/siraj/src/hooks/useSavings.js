import { useContext } from 'react';
import { SavingsContext } from '../context/SavingsContext';

export const useSavings = () => {
  const context = useContext(SavingsContext);
  if (!context) {
    throw new Error('useSavings must be used within a SavingsProvider');
  }
  return context;
};

export default useSavings;