'use client';

interface FormErrorSummaryProps {
  errors: Record<string, { message?: string }>;
}

export function FormErrorSummary({ errors }: FormErrorSummaryProps) {
  const errorEntries = Object.entries(errors).filter(([_, error]) => error?.message);

  if (errorEntries.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md bg-destructive/10 p-3 space-y-1">
      <div className="text-sm font-medium text-destructive">Please fix the following errors:</div>
      <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
        {errorEntries.map(([field, error]) => (
          <li key={field}>
            {field}: {error?.message || 'Invalid value'}
          </li>
        ))}
      </ul>
    </div>
  );
}

