import { useState } from 'react'
import { Recipe, Ingredient, CATEGORIES } from '../types'

interface Props {
  recipe?: Recipe
  onSave: (recipe: Recipe) => void
  onCancel: () => void
}

type DraftIngredient = Ingredient
type Draft = Omit<Recipe, 'id' | 'createdAt'>

function emptyDraft(): Draft {
  return {
    name: '',
    description: '',
    category: 'Dinner',
    servings: 2,
    prepTime: 0,
    cookTime: 0,
    ingredients: [{ amount: '', unit: '', name: '' }],
    instructions: [''],
  }
}

function recipeToDraft(r: Recipe): Draft {
  return {
    name: r.name,
    description: r.description,
    category: r.category,
    servings: r.servings,
    prepTime: r.prepTime,
    cookTime: r.cookTime,
    ingredients: r.ingredients.length ? r.ingredients : [{ amount: '', unit: '', name: '' }],
    instructions: r.instructions.length ? r.instructions : [''],
  }
}

export default function RecipeForm({ recipe, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<Draft>(() =>
    recipe ? recipeToDraft(recipe) : emptyDraft()
  )
  const [errors, setErrors] = useState<string[]>([])

  function update(patch: Partial<Draft>) {
    setDraft(d => ({ ...d, ...patch }))
  }

  // Ingredients
  function updateIngredient(i: number, patch: Partial<DraftIngredient>) {
    const updated = draft.ingredients.map((ing, idx) => idx === i ? { ...ing, ...patch } : ing)
    update({ ingredients: updated })
  }
  function addIngredient() {
    update({ ingredients: [...draft.ingredients, { amount: '', unit: '', name: '' }] })
  }
  function removeIngredient(i: number) {
    const updated = draft.ingredients.filter((_, idx) => idx !== i)
    update({ ingredients: updated.length ? updated : [{ amount: '', unit: '', name: '' }] })
  }

  // Instructions
  function updateInstruction(i: number, text: string) {
    const updated = draft.instructions.map((s, idx) => idx === i ? text : s)
    update({ instructions: updated })
  }
  function addInstruction() {
    update({ instructions: [...draft.instructions, ''] })
  }
  function removeInstruction(i: number) {
    const updated = draft.instructions.filter((_, idx) => idx !== i)
    update({ instructions: updated.length ? updated : [''] })
  }

  function handleSave() {
    const errs: string[] = []
    if (!draft.name.trim()) errs.push('Recipe name is required.')
    if (errs.length) { setErrors(errs); return }

    const saved: Recipe = {
      id: recipe?.id ?? String(Date.now()),
      createdAt: recipe?.createdAt ?? new Date().toISOString(),
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      // Remove blank rows
      ingredients: draft.ingredients.filter(i => i.name.trim()),
      instructions: draft.instructions.filter(s => s.trim()),
    }
    onSave(saved)
  }

  return (
    <div>
      <header className="header">
        <button className="btn-icon" onClick={onCancel}>Cancel</button>
        <span className="header-title">{recipe ? 'Edit Recipe' : 'New Recipe'}</span>
        <button className="btn-icon" onClick={handleSave}>Save</button>
      </header>

      <div className="form">
        {errors.length > 0 && (
          <div className="form-errors">
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Name *</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Banana Bread"
            value={draft.name}
            onChange={e => update({ name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            placeholder="A short note about this recipe..."
            value={draft.description}
            onChange={e => update({ description: e.target.value })}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={draft.category}
              onChange={e => update({ category: e.target.value })}
            >
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Servings</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={draft.servings}
              onChange={e => update({ servings: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Prep (min)</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={draft.prepTime || ''}
              placeholder="0"
              onChange={e => update({ prepTime: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cook (min)</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={draft.cookTime || ''}
              placeholder="0"
              onChange={e => update({ cookTime: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Ingredients */}
        <div className="form-group">
          <label className="form-label">Ingredients</label>
          <div className="ingredient-rows">
            <div className="ingredient-row ingredient-row-header">
              <span style={{ width: 70, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Amount</span>
              <span style={{ width: 80, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Unit</span>
              <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ingredient</span>
            </div>
            {draft.ingredients.map((ing, i) => (
              <div key={i} className="ingredient-row">
                <input
                  className="form-input amount-input"
                  type="text"
                  placeholder="1.5"
                  value={ing.amount}
                  onChange={e => updateIngredient(i, { amount: e.target.value })}
                />
                <input
                  className="form-input unit-input"
                  type="text"
                  placeholder="cups"
                  value={ing.unit}
                  onChange={e => updateIngredient(i, { unit: e.target.value })}
                />
                <input
                  className="form-input name-input"
                  type="text"
                  placeholder="flour"
                  value={ing.name}
                  onChange={e => updateIngredient(i, { name: e.target.value })}
                />
                <button className="btn-remove" onClick={() => removeIngredient(i)} aria-label="Remove">×</button>
              </div>
            ))}
            <button className="btn-add" onClick={addIngredient}>+ Add ingredient</button>
          </div>
        </div>

        {/* Instructions */}
        <div className="form-group">
          <label className="form-label">Instructions</label>
          <div className="instruction-rows">
            {draft.instructions.map((step, i) => (
              <div key={i} className="instruction-row">
                <div className="instruction-num" style={{ marginTop: 10 }}>{i + 1}</div>
                <textarea
                  className="form-textarea"
                  placeholder={`Step ${i + 1}...`}
                  value={step}
                  onChange={e => updateInstruction(i, e.target.value)}
                />
                <button className="btn-remove" onClick={() => removeInstruction(i)} aria-label="Remove">×</button>
              </div>
            ))}
            <button className="btn-add" onClick={addInstruction}>+ Add step</button>
          </div>
        </div>
      </div>

      <div className="form-save">
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave}>
          {recipe ? 'Save Changes' : 'Add Recipe'}
        </button>
      </div>
    </div>
  )
}
