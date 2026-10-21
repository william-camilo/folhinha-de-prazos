// src/pages/Home.tsx
import { useEffect } from 'react';
import { Header } from '../components/Header/Header';
import { ConfigurationBar } from '../components/ConfigurationBar/ConfigurationBar';
import { QuickCalculator } from '../components/QuickCalculator/QuickCalculator';
import { CalendarDaysTable } from '../components/CalendarDaysTable/CalendarDaysTable';
import { BusinessDaysTable } from '../components/BusinessDaysTable/BusinessDaysTable';
import { HolidaysModal } from '../components/HolidaysModal/HolidaysModal';
import { useDateContext } from '../context/DateContext';

export function Home() {
  const { dispatch } = useDateContext();

  // atalho do PWA (manifest "shortcuts") e link direto: #feriados abre o modal
  useEffect(() => {
    const check = () => {
      if (window.location.hash === '#feriados') dispatch({ type: 'openHolidays' });
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, [dispatch]);

  return (
    <div className="app">
      <Header />
      <main className="layout">
        <ConfigurationBar />
        <QuickCalculator />
        <div className="section-heading"><div><p className="section-eyebrow">CONSULTA RÁPIDA</p><h2>Seus prazos, lado a lado.</h2></div><p>Escolha um prazo nas tabelas para atualizar o calendário.</p></div>
        <div className="tables">
          <BusinessDaysTable />
          <CalendarDaysTable />
        </div>
        <p className="disclaimer">
          Considera feriados nacionais e os locais que você adicionar. Suspensões de expediente, recesso forense
          (20/12 a 20/01) e feriados forenses de cada tribunal não entram no cálculo — confira sempre no tribunal.
        </p>
        <footer className="site-footer"><span>Folhinha de Prazos</span><span>Mais clareza para organizar seus dias.</span></footer>
      </main>
      <HolidaysModal />
    </div>
  );
}
