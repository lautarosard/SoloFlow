import { env } from '../config/env';
import { httpRepositories } from './http/repositories.http';
import { mockRepositories } from './mock/repositories.mock';
import type { Repositories } from './repositories';

/** The only place that decides where data comes from (VITE_DATA_SOURCE). */
export const repos: Repositories = env.dataSource === 'api' ? httpRepositories : mockRepositories;

export { RepositoryError } from './repositories';
export type * from './repositories';
