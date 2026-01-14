import React from "react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../style/adminDatePicker.css";

registerLocale("pt-BR", ptBR);

type Props = { selectedDate: Date | null; onChange: (date: Date | null) => void };

export default function AdminDatePicker({ selectedDate, onChange }: Props) {
  return (
    <div className="admin-date-picker">
      <div className="date-display">
        {selectedDate ? format(selectedDate, "dd 'de' MMMM yyyy") : "Selecione uma data"}
      </div>

        <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => onChange(date)}
            inline
            calendarStartDay={0}
            showPopperArrow={false}
            locale="pt-BR"
        />
    </div>
  );
}