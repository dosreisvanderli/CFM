import { useState, useEffect } from 'react';
import { THEMES } from './constants';

export function useTheme() {
  const [themeMode, setThemeMode] = useState<'auto' | 'day' | 'night'>(() => (localStorage.getItem('cfm_theme_mode') as any) || 'auto');
  const [dayStartHour, setDayStartHour] = useState(() => Number(localStorage.getItem('cfm_day_start')) || 6);
  const [dayEndHour, setDayEndHour] = useState(() => Number(localStorage.getItem('cfm_day_end')) || 18);

  const [activeTheme, setActiveTheme] = useState<'day' | 'night'>(() => {
    if (localStorage.getItem('cfm_theme_mode') === 'day') return 'day';
    if (localStorage.getItem('cfm_theme_mode') === 'night') return 'night';
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) return 'night';
    const hour = new Date().getHours();
    const dayStart = Number(localStorage.getItem('cfm_day_start')) || 6;
    const dayEnd = Number(localStorage.getItem('cfm_day_end')) || 18;
    if (dayStart < dayEnd) {
      return (hour >= dayStart && hour < dayEnd) ? 'day' : 'night';
    } else {
      return (hour >= dayStart || hour < dayEnd) ? 'day' : 'night';
    }
  });

  useEffect(() => {
    localStorage.setItem('cfm_theme_mode', themeMode);
    localStorage.setItem('cfm_day_start', dayStartHour.toString());
    localStorage.setItem('cfm_day_end', dayEndHour.toString());
  }, [themeMode, dayStartHour, dayEndHour]);

  useEffect(() => {
    const checkTheme = () => {
      if (themeMode === 'day') {
        setActiveTheme('day');
      } else if (themeMode === 'night') {
        setActiveTheme('night');
      } else {
        const hour = new Date().getHours();
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (prefersDark) {
          setActiveTheme('night');
        } else {
          if (dayStartHour < dayEndHour) {
            setActiveTheme(hour >= dayStartHour && hour < dayEndHour ? 'day' : 'night');
          } else {
            setActiveTheme(hour >= dayStartHour || hour < dayEndHour ? 'day' : 'night');
          }
        }
      }
    };
    checkTheme();
    const interval = setInterval(checkTheme, 60000);
    return () => clearInterval(interval);
  }, [themeMode, dayStartHour, dayEndHour]);

  const theme = THEMES[activeTheme];

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.background);
    }
    document.body.style.backgroundColor = theme.background;
  }, [theme.background]);

  return {
    themeMode,
    setThemeMode,
    dayStartHour,
    setDayStartHour,
    dayEndHour,
    setDayEndHour,
    activeTheme,
    theme,
  };
}
