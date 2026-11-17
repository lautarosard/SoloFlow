/** Mirrors `users` in backend/src/docs/modelo-datos.md, plus UI preferences. */
export interface User {
  id: string;
  name: string;
  role_title: string;
  email: string;
  created_at: string;
}

export type UpdateUserInput = Partial<Pick<User, 'name' | 'role_title'>>;

/** Client-side preferences (not part of the data model). */
export interface UserPreferences {
  default_duration_minutes: number;
  /** 0 = Sunday, 1 = Monday (date-fns convention). */
  week_starts_on: 0 | 1;
  last_client_id: string | null;
}
