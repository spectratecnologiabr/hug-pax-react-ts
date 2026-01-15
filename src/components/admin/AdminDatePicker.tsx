import React from "react";
import DatePicker from "react-datepicker";
import { ptBR } from "date-fns/locale";
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../style/adminDatePicker.css";

registerLocale("pt-BR", ptBR);

type Props = { selectedDate: Date | null; onChange: (date: Date | null) => void };

export default function AdminDatePicker({ selectedDate, onChange }: Props) {
  return (
    <div className="admin-date-picker">
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => onChange(date)}
        inline
        calendarStartDay={0}
        showPopperArrow={false}
        locale="pt-BR"
        renderCustomHeader={({
          monthDate,
          decreaseMonth,
          increaseMonth
        }) => (
          <div className="custom-calendar-header">
            <button type="button" className="calendar-nav-btn" onClick={decreaseMonth}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
            </button>
            <span className="calendar-month-label">
              {monthDate.toLocaleString("pt-BR", { month: "long", year: "numeric" })}
            </span>
            <button type="button" className="calendar-nav-btn" onClick={increaseMonth}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
            </button>
          </div>
        )}
      />
    </div>
  );
}