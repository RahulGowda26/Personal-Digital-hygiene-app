type ServiceError = {
  code?: string;
  message?: string;
};

export function userFacingError(error: unknown, fallback: string): string {
  const serviceError = error as ServiceError | null;
  const code = serviceError?.code;
  const message = serviceError?.message ?? '';

  if (
    code === '42P01' ||
    message.includes('relation') ||
    message.includes('schema cache')
  ) {
    return 'Database setup is incomplete. Run the project SQL migration in Supabase SQL Editor, then try again.';
  }

  if (code === '42501' || message.includes('row-level security')) {
    return 'Your account does not have permission for this action. Check the RLS policies in the project SQL migration.';
  }

  return message || fallback;
}
