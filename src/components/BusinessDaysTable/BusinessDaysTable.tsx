// src/components/BusinessDaysTable/BusinessDaysTable.tsx
import { DeadlineTable } from '../DeadlineTable/DeadlineTable';

export function BusinessDaysTable() {
  return (
    <DeadlineTable
      mode="uteis"
      title="Dias úteis"
      description="Pula sábados, domingos e feriados"
    />
  );
}
