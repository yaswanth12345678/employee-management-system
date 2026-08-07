import { useEffect, useState } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * A debounced search input. It owns the raw text locally and only calls `onSearch` after the
 * user pauses (via useDebounce), so consumers get search terms without every keystroke firing a
 * request. `onSearch` must be a stable reference (useCallback / a state setter) to avoid loops.
 */
interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  delay?: number;
}

export function SearchBar({ placeholder = 'Search…', onSearch, delay = 350 }: SearchBarProps) {
  const [value, setValue] = useState('');
  const debounced = useDebounce(value, delay);

  useEffect(() => {
    onSearch(debounced);
  }, [debounced, onSearch]);

  return (
    <TextField
      size="small"
      fullWidth
      value={value}
      placeholder={placeholder}
      onChange={(event) => setValue(event.target.value)}
      sx={{ maxWidth: 360 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );
}
