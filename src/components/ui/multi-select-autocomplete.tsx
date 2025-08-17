import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  id: string | number;
  label: string;
  value: string | number;
}

interface MultiSelectAutocompleteProps {
  options: Option[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  getOptionLabel?: (option: Option) => string;
  renderOption?: (option: Option) => React.ReactNode;
  freeSolo?: boolean;
  onInputChange?: (value: string) => void;
  inputValue?: string;
  noOptionsText?: string;
  maxHeight?: number;
}

export const MultiSelectAutocomplete = React.forwardRef<
  HTMLDivElement,
  MultiSelectAutocompleteProps
>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Search...",
      disabled = false,
      className,
      getOptionLabel = (option) => option.label,
      renderOption,
      freeSolo = true,
      onInputChange,
      inputValue: controlledInputValue,
      noOptionsText = "No options found",
      maxHeight = 240,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [internalInputValue, setInternalInputValue] = useState("");
    const [focusedIndex, setFocusedIndex] = useState(-1);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const inputValue = controlledInputValue ?? internalInputValue;

    // Get selected options based on value
    const selectedOptions = options.filter((option) =>
      value.includes(option.value)
    );

    // Filter options based on input value and exclude already selected ones
    const filteredOptions = options.filter((option) => {
      const matchesInput = getOptionLabel(option)
        .toLowerCase()
        .includes(inputValue.toLowerCase());
      const notSelected = !value.includes(option.value);
      return matchesInput && notSelected;
    });

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalInputValue(newValue);
      onInputChange?.(newValue);
      setFocusedIndex(-1);
    };

    // Handle option selection
    const handleOptionSelect = (option: Option) => {
      if (!value.includes(option.value)) {
        onChange([...value, option.value]);
      }
      setInternalInputValue("");
      onInputChange?.("");
      setIsOpen(false);
      inputRef.current?.focus();
    };

    // Handle removing selected option
    const handleRemoveOption = (optionValue: string | number) => {
      onChange(value.filter((v) => v !== optionValue));
      inputRef.current?.focus();
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setIsOpen(true);
          setFocusedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (isOpen && focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            handleOptionSelect(filteredOptions[focusedIndex]);
          } else if (freeSolo && inputValue.trim()) {
            // Handle freeSolo input - create new option
            const newOption: Option = {
              id: inputValue,
              label: inputValue,
              value: inputValue,
            };
            handleOptionSelect(newOption);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        case "Backspace":
          if (inputValue === "" && value.length > 0) {
            // Remove last selected option when input is empty
            onChange(value.slice(0, -1));
          }
          break;
      }
    };

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const container = ref && 'current' in ref ? ref.current : containerRef.current;
        if (
          container &&
          !container.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    // Scroll focused option into view
    useEffect(() => {
      if (focusedIndex >= 0 && listRef.current) {
        const focusedElement = listRef.current.children[focusedIndex] as HTMLElement;
        if (focusedElement) {
          focusedElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }
      }
    }, [focusedIndex]);

    return (
      <div
        ref={ref || containerRef}
        className={cn("relative", className)}
        {...props}
      >
        <div
          className={cn(
            "flex min-h-9 w-full flex-wrap gap-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
            "focus-within:outline-none focus-within:ring-1 focus-within:ring-ring",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          onClick={() => {
            if (!disabled) {
              inputRef.current?.focus();
              setIsOpen(true);
            }
          }}
        >
          {/* Selected options as chips */}
          {selectedOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
            >
              <span>{getOptionLabel(option)}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveOption(option.value);
                  }}
                  className="hover:text-secondary-foreground/80"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => !disabled && setIsOpen(true)}
            placeholder={selectedOptions.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[100px]"
          />

          {/* Dropdown indicator */}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>

        {/* Dropdown list */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
            <ul
              ref={listRef}
              className="py-1 overflow-auto"
              style={{ maxHeight }}
            >
              {filteredOptions.length === 0 && inputValue && freeSolo ? (
                <li
                  className={cn(
                    "px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    focusedIndex === 0 && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    const newOption: Option = {
                      id: inputValue,
                      label: inputValue,
                      value: inputValue,
                    };
                    handleOptionSelect(newOption);
                  }}
                >
                  Add "{inputValue}"
                </li>
              ) : filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  {noOptionsText}
                </li>
              ) : (
                filteredOptions.map((option, index) => (
                  <li
                    key={option.id}
                    className={cn(
                      "px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                      focusedIndex === index && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => handleOptionSelect(option)}
                  >
                    {renderOption ? renderOption(option) : getOptionLabel(option)}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

MultiSelectAutocomplete.displayName = "MultiSelectAutocomplete";
