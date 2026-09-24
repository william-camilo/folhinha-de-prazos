import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateProvider, createInitialState } from '../../context/DateContext';
import { QuickCalculator } from './QuickCalculator';

function setup() {
  const initial = { ...createInitialState(new Date(2026, 8, 22)), days: 15, mode: 'uteis' as const };
  render(
    <DateProvider initialState={initial}>
      <QuickCalculator />
    </DateProvider>,
  );
}

describe('<QuickCalculator />', () => {
  it('mostra o vencimento em dias úteis', () => {
    setup();
    expect(screen.getByTestId('result-date')).toHaveTextContent('14 de outubro de 2026');
  });

  it('troca para dias corridos e usa um prazo rápido', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Dias corridos' }));
    await user.click(screen.getByRole('button', { name: '10' }));
    expect(screen.getByTestId('result-date')).toHaveTextContent('2 de outubro de 2026');
  });

  it('conta dias entre datas', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Entre datas' }));
    expect(screen.getByTestId('count-corridos')).toHaveTextContent('30');
  });

  it('clicar num dia do calendário ajusta o prazo', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^20\/10\/2026.*Definir como vencimento/ }));
    expect(screen.getByLabelText(/Prazo em dias/)).toHaveValue(19); // 12/10 é feriado
    expect(screen.getByTestId('result-date')).toHaveTextContent('20 de outubro de 2026');
  });
});
