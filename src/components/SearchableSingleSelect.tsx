import React, { useEffect, useMemo, useRef, useState } from "react";
import "../style/searchableSingleSelect.css";

export type SearchableSingleSelectOption = {
  value: string;
  label: string;
};

type SearchableSingleSelectProps = {
  value: string;
  options: SearchableSingleSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function SearchableSingleSelect({
  value,
  options,
  placeholder,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhuma opção encontrada",
  disabled = false,
  onChange,
}: SearchableSingleSelectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return options;

    return options.filter((option) => option.label.toLowerCase().includes(normalizedSearch));
  }, [options, search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (!containerRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className={`searchable-single-select ${disabled ? "is-disabled" : ""}`} ref={containerRef}>
      <button
        type="button"
        className={`searchable-single-select-trigger ${open ? "is-open" : ""}`}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        disabled={disabled}
      >
        {selectedOption?.label || placeholder}
      </button>

      {open && !disabled ? (
        <div className="searchable-single-select-popup">
          <input
            type="search"
            className="searchable-single-select-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
          />

          <div className="searchable-single-select-options">
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`searchable-single-select-option ${option.value === value ? "is-selected" : ""}`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="searchable-single-select-empty">{emptyMessage}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SearchableSingleSelect;
