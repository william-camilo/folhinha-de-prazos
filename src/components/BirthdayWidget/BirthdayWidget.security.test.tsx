import { afterEach, beforeEach, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BirthdayWidget } from './BirthdayWidget';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

it('rejeita datas inválidas e mantém conteúdo HTML do nome como texto inerte', async () => {
  const user = userEvent.setup();
  const { container } = render(<BirthdayWidget />);
  await user.click(screen.getByRole('button', { name: /Adicionar aniversariante/ }));
  const name = '<img src=x onerror=alert(1)>';
  await user.type(screen.getByLabelText('Nome'), name);
  await user.type(screen.getByLabelText('Dia e mês'), '3102');
  await user.click(screen.getByRole('button', { name: /Salvar aniversariante/ }));
  expect(screen.getByRole('alert')).toHaveTextContent('data válida');
  expect(JSON.parse(localStorage.getItem('folhinha-prazos:birthdays')!)).toEqual([]);
  await user.clear(screen.getByLabelText('Dia e mês'));
  await user.type(screen.getByLabelText('Dia e mês'), '0202');
  await user.click(screen.getByRole('button', { name: /Salvar aniversariante/ }));
  expect(screen.getByText(name)).toBeInTheDocument();
  expect(container.querySelector('img')).toBeNull();
  expect(JSON.parse(localStorage.getItem('folhinha-prazos:birthdays')!)[0]).toMatchObject({ name, monthDay: '02-02' });
});
