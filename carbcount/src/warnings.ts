import type { Macros, SupplementWarning } from './types'

const DAILY_TARGETS = {
  calories: { min: 1200, ideal: 2000 },
  carbs: { min: 50, ideal: 225 },
  protein: { min: 50, ideal: 100 },
  fat: { min: 20, ideal: 65 },
  fiber: { min: 15, ideal: 30 },
}

export function getWarnings(totals: Macros): SupplementWarning[] {
  const warnings: SupplementWarning[] = []

  if (totals.calories > 0 && totals.calories < DAILY_TARGETS.calories.min) {
    warnings.push({
      nutrient: 'CALORIES',
      message: 'Very low energy intake detected',
      severity: 'critical',
      emoji: '⚡',
    })
  }

  if (totals.protein > 0 && totals.protein < DAILY_TARGETS.protein.min) {
    warnings.push({
      nutrient: 'PROTEIN',
      message: 'Consider whey or plant protein supplement',
      severity: 'warning',
      emoji: '💪',
    })
  }

  if (totals.carbs > 0 && totals.carbs < DAILY_TARGETS.carbs.min) {
    warnings.push({
      nutrient: 'CARBS',
      message: 'Low carbs — consider energy gels or oats',
      severity: 'warning',
      emoji: '🍞',
    })
  }

  if (totals.fiber > 0 && totals.fiber < DAILY_TARGETS.fiber.min) {
    warnings.push({
      nutrient: 'FIBER',
      message: 'Consider psyllium husk or fiber supplement',
      severity: 'warning',
      emoji: '🌾',
    })
  }

  if (totals.fat > 0 && totals.fat < DAILY_TARGETS.fat.min) {
    warnings.push({
      nutrient: 'FAT',
      message: 'Low healthy fats — consider omega-3 supplement',
      severity: 'warning',
      emoji: '🐟',
    })
  }

  return warnings
}

export function sumMacros(entries: { macros: Macros }[]): Macros {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.macros.calories,
      carbs: acc.carbs + e.macros.carbs,
      protein: acc.protein + e.macros.protein,
      fat: acc.fat + e.macros.fat,
      fiber: acc.fiber + e.macros.fiber,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 }
  )
}

export function getProgressPercent(value: number, nutrient: keyof typeof DAILY_TARGETS): number {
  const ideal = DAILY_TARGETS[nutrient].ideal
  return Math.min(100, Math.round((value / ideal) * 100))
}
