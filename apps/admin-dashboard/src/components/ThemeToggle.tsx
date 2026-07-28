import React from 'react';
import { Button } from 'antd';
import { Moon, Sun } from 'lucide-react';
import useTheme from '../hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useTheme();

  return (
    <Button
      type="text"
      icon={mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      onClick={toggleTheme}
      className="!flex !items-center !justify-center"
      title={mode === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
    />
  );
};

export default ThemeToggle;
