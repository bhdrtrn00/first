import type { DailyLog, FoodEntry } from './types'

const LOG_KEY = 'carbquest_log'
const API_KEY_KEY = 'carbquest_api_key'

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

export function loadLog(): DailyLog {
  const today = getTodayKey()
  const raw = localStorage.getItem(LOG_KEY)
  if (!raw) return { date: today, entries: [] }
  try {
    const all = JSON.parse(raw) as Record<string, DailyLog>
    return all[today] ?? { date: today, entries: [] }
  } catch {
    return { date: today, entries: [] }
  }
}

export function saveEntry(entry: FoodEntry): void {
  const today = getTodayKey()
  const raw = localStorage.getItem(LOG_KEY)
  const all: Record<string, DailyLog> = raw ? JSON.parse(raw) : {}
  if (!all[today]) all[today] = { date: today, entries: [] }
  all[today].entries.push(entry)
  // Keep only last 30 days
  const keys = Object.keys(all).sort().reverse().slice(0, 30)
  const trimmed: Record<string, DailyLog> = {}
  for (const k of keys) trimmed[k] = all[k]
  localStorage.setItem(LOG_KEY, JSON.stringify(trimmed))
}

export function deleteEntry(id: string): void {
  const today = getTodayKey()
  const raw = localStorage.getItem(LOG_KEY)
  if (!raw) return
  const all: Record<string, DailyLog> = JSON.parse(raw)
  if (!all[today]) return
  all[today].entries = all[today].entries.filter((e) => e.id !== id)
  localStorage.setItem(LOG_KEY, JSON.stringify(all))
}

export function loadApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) ?? ''
}

export function saveApiKey(key: string): void {
  localStorage.setItem(API_KEY_KEY, key)
}
