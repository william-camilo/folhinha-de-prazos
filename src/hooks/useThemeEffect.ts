// src/hooks/useThemeEffect.ts
// Aplica o tema escolhido em <html data-theme>. Em "sistema" não toca no
// atributo (respeita prefers-color-scheme e quem hospeda a página).
import { useEffect, useRef } from 'react';
import type { ThemeChoice } from '../context/DateContext';

export function useThemeEffect(theme: ThemeChoice) {
  const touched = useRef(false);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      if (touched.current) root.removeAttribute('data-theme');
      return;
    }
    touched.current = true;
    root.setAttribute('data-theme', theme);
  }, [theme]);
}
