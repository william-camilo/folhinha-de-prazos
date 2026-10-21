import { beforeEach, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BirthdayWidget } from './BirthdayWidget';

beforeEach(() => localStorage.clear());

it('atualiza o resumo e o diálogo a partir do mesmo cadastro', async () => {
  const user = userEvent.setup();
  const { container } = render(<><div id="birthday-overview" /><BirthdayWidget /></>);
  const overview = within(container.querySelector('#birthday-overview') as HTMLElement);
  await user.click(overview.getByRole('button', { name: /Adicionar aniversariante/ }));
  await user.type(screen.getByLabelText('Nome'), 'Marina Costa');
  await user.type(screen.getByLabelText('Dia e mês'), '2412');
  await user.click(screen.getByRole('button', { name: /Salvar aniversariante/ }));
  expect(overview.getByText('Marina Costa')).toBeInTheDocument();
  expect(overview.getByText(/24\/12/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Remover Marina Costa' }));
  expect(overview.queryByText('Marina Costa')).not.toBeInTheDocument();
  expect(overview.getByText(/Guarde as datas/)).toBeInTheDocument();
});
