import type { ReactNode } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { MenuItem, TextField, type TextFieldProps } from '@mui/material';

interface SelectOption {
  value: string;
  label: string;
}

type FormTextFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  /** When provided, renders a select with these options. */
  options?: SelectOption[];
  children?: ReactNode;
} & Omit<TextFieldProps, 'name' | 'error' | 'value' | 'onChange' | 'children'>;

/**
 * RHF-connected MUI TextField. Passes the RHF ref to the INPUT (`inputRef`), not the root — so
 * focus-on-validation-error works. Reduces Controller boilerplate and supports selects via `options`.
 */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  options,
  children,
  helperText,
  ...textFieldProps
}: FormTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const { ref, ...fieldRest } = field;
        return (
          <TextField
            {...fieldRest}
            {...textFieldProps}
            inputRef={ref}
            select={Boolean(options) || textFieldProps.select}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? helperText}
          >
            {options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
            {children}
          </TextField>
        );
      }}
    />
  );
}
