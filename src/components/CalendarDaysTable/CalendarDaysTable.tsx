// src/components/CalendarDaysTable/CalendarDaysTable.tsx
import { DeadlineTable } from '../DeadlineTable/DeadlineTable';

export function CalendarDaysTable() {
  return (
    <DeadlineTable
      mode="corridos"
      title="Dias corridos"
      description="Todos os dias contam; o vencimento pode ser prorrogado"
    />
  );
}
