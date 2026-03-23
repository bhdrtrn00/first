export interface Macros {
  calories: number
  carbs: number
  protein: number
  fat: number
  fiber: number
}

export interface FoodEntry {
  id: string
  timestamp: number
  description: string
  imageData?: string
  macros: Macros
}

export interface DailyLog {
  date: string // YYYY-MM-DD
  entries: FoodEntry[]
}

export interface SupplementWarning {
  nutrient: string
  message: string
  severity: 'warning' | 'critical'
  emoji: string
}

export type Screen = 'home' | 'camera' | 'analyzing' | 'result' | 'dashboard' | 'settings'
