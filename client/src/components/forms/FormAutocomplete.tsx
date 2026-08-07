import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Autocomplete, TextField } from '@mui/material';

export interface AutocompleteOption {
  id: string;
  label: string;
}

interface FormAutocompleteProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: AutocompleteOption[];
  /** Label for a currently-selected id that isn't in `options` (edit mode when the option set is capped). */
  currentLabel?: string;
  disabled?: boolean;
}

/**
 * RHF-connected, SEARCHABLE picker (MUI Autocomplete). Stores the selected option's `id` in the
 * form. If the current value isn't among the loaded options (e.g. the options list is capped at
 * 100 and the selected record is beyond it), we inject it via `currentLabel` so it renders instead
 * of showing blank.
 */
export function FormAutocomplete<T extends FieldValues>({
  control,
  name,
  label,
  options,
  currentLabel,
  disabled,
}: FormAutocompleteProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const valueId = (field.value as string) || '';
        const effective =
          valueId && currentLabel && !options.some((o) => o.id === valueId)
            ? [{ id: valueId, label: currentLabel }, ...options]
            : options;
        const selected = effective.find((o) => o.id === valueId) ?? null;
        return (
          <Autocomplete
            options={effective}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            value={selected}
            onChange={(_event, value) => field.onChange(value ? value.id : '')}
            onBlur={field.onBlur}
            disabled={disabled}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                inputRef={field.ref}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
        );
      }}
    />
  );
}
