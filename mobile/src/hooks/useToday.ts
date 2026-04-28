import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useToday(): string {
  const [today, setToday] = useState(todayString);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const next = todayString();
        setToday((prev) => (prev === next ? prev : next));
      }
    });
    return () => sub.remove();
  }, []);

  return today;
}
