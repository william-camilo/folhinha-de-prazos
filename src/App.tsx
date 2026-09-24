// src/App.tsx
import { DateProvider, useDateContext } from './context/DateContext';
import { useThemeEffect } from './hooks/useThemeEffect';
import { Home } from './pages/Home';

function Themed() {
  const { state } = useDateContext();
  useThemeEffect(state.theme);
  return <Home />;
}

export default function App() {
  return (
    <DateProvider>
      <Themed />
    </DateProvider>
  );
}
