import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { ptBR } from "date-fns/locale";
import { registerLocale } from "react-datepicker";
import { getDatesWithVisit } from "../../controllers/consultant/getDatesWithVisits.controller";
import "react-datepicker/dist/react-datepicker.css";
import "../../style/adminDatePicker.css";

registerLocale("pt-BR", ptBR);

type Props = { selectedDate: Date | null; onChange: (date: Date | null) => void };

export default function AdminDatePicker({ selectedDate, onChange }: Props) {
  const [highlightedDates, setHighlightedDates] = useState<Date[]>([]);

  async function loadHighlightedDates(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());

    const dates = await getDatesWithVisit(month, year);

    if (!Array.isArray(dates)) {
      setHighlightedDates([]);
      return;
    }

    const parsedDates = dates.map((d: string) => {
      const [y, m, day] = d.split("-").map(Number);
      return new Date(y, m - 1, day);
    });

    setHighlightedDates(parsedDates);
  }

  useEffect(() => {
    const baseDate = selectedDate ?? new Date();
    loadHighlightedDates(baseDate);
  }, []);

  return (
    <div className="admin-date-picker admin">
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => onChange(date)}
        onMonthChange={(date) => {
          onChange(null);
          loadHighlightedDates(date);
        }}
        disabledKeyboardNavigation
        inline
        calendarStartDay={1}
        showPopperArrow={false}
        locale="pt-BR"
        highlightDates={highlightedDates}
        renderCustomHeader={({
          monthDate,
          decreaseMonth,
          increaseMonth,
        }) => (
          <div className="custom-calendar-header admin">
            <span className="main-calendar-label">
              <b>Calendário</b>
            </span>

            <div className="calendar-nav">
              <button type="button" className="calendar-nav-btn" onClick={decreaseMonth}>
                <svg xmlns="http://www.w3.org/2000/svg" height="10" viewBox="0 0 7 12" fill="none">
                  <path d="M6.2925 9.4625L2.4125 5.5825L6.2925 1.7025C6.6825 1.3125 6.6825 0.6825 6.2925 0.2925C5.9025 -0.0975 5.2725 -0.0975 4.8825 0.2925L0.2925 4.8825C-0.0975 5.2725 -0.0975 5.9025 0.2925 6.2925L4.8825 10.8825C5.2725 11.2725 5.9025 11.2725 6.2925 10.8825C6.6725 10.4925 6.6825 9.8525 6.2925 9.4625Z" fill="#334155"/>
                </svg>
              </button>

              <b className="calendar-month-label">
                {`${monthDate.toLocaleString("pt-BR", { month: "long" })} ${monthDate.getFullYear()}`}
              </b>

              <button type="button" className="calendar-nav-btn" onClick={increaseMonth}>
                <svg xmlns="http://www.w3.org/2000/svg" height="10" viewBox="0 0 7 12" fill="none">
                  <path d="M0.2925 9.4625L4.1725 5.5825L0.2925 1.7025C-0.0975 1.3125 -0.0975 0.6825 0.2925 0.2925C0.6825 -0.0975 1.3125 -0.0975 1.7025 0.2925L6.2925 4.8825C6.6825 5.2725 6.6825 5.9025 6.2925 6.2925L1.7025 10.8825C1.3125 11.2725 0.6825 11.2725 0.2925 10.8825C-0.0875 10.4925 -0.0975 9.8525 0.2925 9.4625Z" fill="#334155"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
}