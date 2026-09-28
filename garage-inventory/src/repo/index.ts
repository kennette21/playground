import { LocalRepo } from './localRepo'
import { SupabaseRepo } from './supabaseRepo'
import type { Repo } from './types'

export interface BackendConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

const CFG_KEY = 'garage-inventory:backend'

/** Config precedence: Settings page (localStorage) > Vite env vars > none (local mode). */
export function loadBackendConfig(): BackendConfig {
  try {
    const raw = localStorage.getItem(CFG_KEY)
    if (raw) return JSON.parse(raw) as BackendConfig
  } catch {
    /* ignore */
  }
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  }
}

export function saveBackendConfig(cfg: BackendConfig) {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg))
}

export function createRepo(cfg = loadBackendConfig()): Repo {
  if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
    try {
      return new SupabaseRepo(cfg.supabaseUrl, cfg.supabaseAnonKey)
    } catch (e) {
      console.warn('Invalid Supabase config, falling back to local storage', e)
    }
  }
  return new LocalRepo()
}

export type { Repo }
export { LocalRepo, SupabaseRepo }
