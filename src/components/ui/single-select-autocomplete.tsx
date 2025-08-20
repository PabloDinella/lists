import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  id: string | number;
  label: string;
  value: string | number;
  level?: number; // For hierarchical indentation
}

export interface OptionGroup {
  label: string;
  options: Option[];
}

interface SingleSelectAutocompleteProps {
  options?: Option[];
  groupedOptions?: OptionGroup[];
  hierarchicalOptions?: Option[]; // New prop for hierarchical options
  value: string | number | null;
  onChange: (value: string | number | null) => void;
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

export const SingleSelectAutocomplete = React.forwardRef<
  HTMLDivElement,
  SingleSelectAutocompleteProps
>(
  (
    {
      options,
      groupedOptions,
      hierarchicalOptions,
      value,
      onChange,
      placeholder = "Search...",
      disabled = false,
      className,
      getOptionLabel = (option) => option.label,
      renderOption,
      freeSolo = false,
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

    // Flatten all options for easier searching and selection
    const allOptions: Option[] = hierarchicalOptions ? hierarchicalOptions :
      options ? options : 
      groupedOptions ? groupedOptions.flatMap(group => group.options) : [];

    // Get selected option based on value
    const selectedOption = allOptions.find((option) => option.value === value);

    // Filter options based on input value
    const filteredAllOptions = allOptions.filter((option) =>
      getOptionLabel(option)
        .toLowerCase()
        .includes(inputValue.toLowerCase())
    );

    // Create filtered grouped options for rendering
    const filteredGroupedOptions = groupedOptions ? 
      groupedOptions.map(group => ({
        ...group,
        options: group.options.filter(option => 
          filteredAllOptions.some(filtered => filtered.id === option.id)
        )
      })).filter(group => group.options.length > 0) : undefined;

    // For keyboard navigation, we need a flat list of filtered options
    const filteredOptions = filteredAllOptions;

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalInputValue(newValue);
      onInputChange?.(newValue);
      setFocusedIndex(-1);
      setIsOpen(true);
    };

    // Handle option selection
    const handleOptionSelect = (option: Option) => {
      onChange(option.value);
      setInternalInputValue("");
      onInputChange?.("");
      setIsOpen(false);
      inputRef.current?.blur();
    };

    // Handle clear selection
    const handleClear = () => {
      onChange(null);
      setInternalInputValue("");
      onInputChange?.("");
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
          inputRef.current?.blur();
          break;
        case "Backspace":
          if (inputValue === "" && selectedOption) {
            // Clear selection when input is empty
            handleClear();
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

    // Display value in input when not focused
    const displayValue = isOpen || inputValue 
      ? inputValue 
      : selectedOption 
        ? getOptionLabel(selectedOption) 
        : "";

    return (
      <div
        ref={ref || containerRef}
        className={cn("relative", className)}
        {...props}
      >
        <div
          className={cn(
            "flex min-h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
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
          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (!disabled) {
                setIsOpen(true);
                // Clear input when focusing to allow searching
                if (selectedOption && !inputValue) {
                  setInternalInputValue("");
                }
              }
            }}
            onBlur={() => {
              // Reset input value to show selected option when not focused
              if (selectedOption && !inputValue) {
                setInternalInputValue("");
              }
            }}
            placeholder={!selectedOption ? placeholder : ""}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />

          {/* Dropdown indicator */}
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
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
                <>
                  {hierarchicalOptions ? (
                    // Render hierarchical options
                    filteredOptions.map((option, index) => (
                      <li
                        key={option.id}
                        className={cn(
                          "py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                          focusedIndex === index && "bg-accent text-accent-foreground",
                          selectedOption?.value === option.value && "bg-accent/50"
                        )}
                        style={{
                          paddingLeft: `${12 + (option.level || 0) * 20}px`,
                        }}
                        onClick={() => handleOptionSelect(option)}
                      >
                        {renderOption ? renderOption(option) : getOptionLabel(option)}
                      </li>
                    ))
                  ) : groupedOptions && filteredGroupedOptions ? (
                    // Render grouped options
                    filteredGroupedOptions.map((group) => (
                      <div key={group.label}>
                        <li className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/50">
                          {group.label}
                        </li>
                        {group.options.map((option) => {
                          const flatIndex = filteredOptions.findIndex(o => o.id === option.id);
                          return (
                            <li
                              key={option.id}
                              className={cn(
                                "px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                                focusedIndex === flatIndex && "bg-accent text-accent-foreground",
                                selectedOption?.value === option.value && "bg-accent/50"
                              )}
                              onClick={() => handleOptionSelect(option)}
                            >
                              {renderOption ? renderOption(option) : getOptionLabel(option)}
                            </li>
                          );
                        })}
                      </div>
                    ))
                  ) : (
                    // Render flat options
                    filteredOptions.map((option, index) => (
                      <li
                        key={option.id}
                        className={cn(
                          "px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                          focusedIndex === index && "bg-accent text-accent-foreground",
                          selectedOption?.value === option.value && "bg-accent/50"
                        )}
                        onClick={() => handleOptionSelect(option)}
                      >
                        {renderOption ? renderOption(option) : getOptionLabel(option)}
                      </li>
                    ))
                  )}
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

SingleSelectAutocomplete.displayName = "SingleSelectAutocomplete";
