/**
 * services/index.ts — Barrel export de todos os serviços do LINE OS
 * 
 * Padrão de import recomendado nos hooks e contexts:
 *   import { fetchTasks, createTask } from '../services';
 */

export * from './taskService';
export * from './leadService';
export * from './contentService';
export * from './transactionService';
export * from './clientService';
export * from './meetingService';
