export interface Ingredient {
  amount: string
  unit: string
  name: string
}

export interface Recipe {
  id: string
  name: string
  description: string
  category: string
  servings: number
  prepTime: number  // minutes
  cookTime: number  // minutes
  ingredients: Ingredient[]
  instructions: string[]
  createdAt: string
}

export const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Drink', 'Other']

export function loadRecipes(): Recipe[] {
  try {
    const stored = localStorage.getItem('recipes')
    if (stored) return JSON.parse(stored)
  } catch {
    // ignore
  }
  return SAMPLE_RECIPES
}

export function saveRecipes(recipes: Recipe[]): void {
  localStorage.setItem('recipes', JSON.stringify(recipes))
}

export function formatTime(minutes: number): string {
  if (minutes === 0) return '—'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function scaleAmount(amount: string, factor: number): string {
  const n = parseFloat(amount)
  if (isNaN(n)) return amount
  const scaled = n * factor
  // Clean up floating point noise
  const result = Math.round(scaled * 100) / 100
  return result % 1 === 0 ? String(result) : String(result)
}

const SAMPLE_RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Classic Pancakes',
    description: 'Fluffy weekend pancakes, ready in under 30 minutes.',
    category: 'Breakfast',
    servings: 4,
    prepTime: 10,
    cookTime: 15,
    ingredients: [
      { amount: '1.5', unit: 'cups', name: 'all-purpose flour' },
      { amount: '2', unit: 'tbsp', name: 'sugar' },
      { amount: '1', unit: 'tsp', name: 'baking powder' },
      { amount: '0.5', unit: 'tsp', name: 'salt' },
      { amount: '1.25', unit: 'cups', name: 'milk' },
      { amount: '1', unit: '', name: 'egg' },
      { amount: '2', unit: 'tbsp', name: 'melted butter' },
    ],
    instructions: [
      'Whisk together flour, sugar, baking powder, and salt in a large bowl.',
      'In a separate bowl, mix milk, egg, and melted butter.',
      'Pour wet ingredients into dry and stir until just combined — lumps are fine.',
      'Heat a non-stick pan over medium heat and lightly grease with butter.',
      'Pour ¼ cup batter per pancake. Cook until bubbles form, then flip and cook 1 minute more.',
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Pasta al Pomodoro',
    description: 'Simple Italian tomato pasta with fresh basil.',
    category: 'Dinner',
    servings: 2,
    prepTime: 5,
    cookTime: 20,
    ingredients: [
      { amount: '200', unit: 'g', name: 'spaghetti' },
      { amount: '400', unit: 'g', name: 'canned crushed tomatoes' },
      { amount: '3', unit: 'cloves', name: 'garlic, sliced' },
      { amount: '3', unit: 'tbsp', name: 'olive oil' },
      { amount: '10', unit: 'leaves', name: 'fresh basil' },
      { amount: '', unit: '', name: 'salt and pepper to taste' },
    ],
    instructions: [
      'Bring a large pot of salted water to a boil.',
      'Gently fry garlic in olive oil over medium-low heat until golden, about 3 minutes.',
      'Add crushed tomatoes, season with salt and pepper, and simmer 15 minutes.',
      'Cook pasta according to package directions. Reserve ½ cup pasta water before draining.',
      'Toss pasta into the sauce, adding pasta water as needed to loosen.',
      'Finish with fresh basil leaves and a drizzle of olive oil.',
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Avocado Toast',
    description: 'Quick and filling — great for busy mornings.',
    category: 'Breakfast',
    servings: 1,
    prepTime: 5,
    cookTime: 3,
    ingredients: [
      { amount: '2', unit: 'slices', name: 'sourdough bread' },
      { amount: '1', unit: '', name: 'ripe avocado' },
      { amount: '1', unit: 'tsp', name: 'lemon juice' },
      { amount: '', unit: 'pinch', name: 'red pepper flakes' },
      { amount: '', unit: '', name: 'salt and pepper' },
    ],
    instructions: [
      'Toast the bread until golden and crisp.',
      'Mash avocado with lemon juice, salt, and pepper.',
      'Spread onto toast and sprinkle with red pepper flakes.',
    ],
    createdAt: new Date().toISOString(),
  },
]
