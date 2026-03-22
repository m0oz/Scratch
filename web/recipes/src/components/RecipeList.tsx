import { useState } from 'react'
import { Recipe, CATEGORIES, formatTime } from '../types'

interface Props {
  recipes: Recipe[]
  onSelect: (id: string) => void
  onAdd: () => void
}

export default function RecipeList({ recipes, onSelect, onAdd }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const filtered = recipes.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || r.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div>
      <header className="header">
        <span className="header-title">My Recipes</span>
        <button className="btn-icon" onClick={onAdd}>+ New</button>
      </header>

      <div className="search-wrap">
        <input
          className="search-input"
          type="search"
          placeholder="Search recipes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="category-filter">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`cat-chip ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="recipe-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🍽️</div>
            <div className="empty-state-text">
              {recipes.length === 0
                ? 'No recipes yet. Add your first one!'
                : 'No recipes match your search.'}
            </div>
          </div>
        ) : (
          filtered.map(recipe => (
            <div key={recipe.id} className="recipe-card" onClick={() => onSelect(recipe.id)}>
              <div className="recipe-card-name">{recipe.name}</div>
              <div className="recipe-card-meta">
                <span>{recipe.category}</span>
                {recipe.prepTime + recipe.cookTime > 0 && (
                  <span>⏱ {formatTime(recipe.prepTime + recipe.cookTime)}</span>
                )}
                <span>👤 {recipe.servings}</span>
              </div>
              {recipe.description && (
                <div className="recipe-card-desc">{recipe.description}</div>
              )}
            </div>
          ))
        )}
      </div>

      <button className="fab" onClick={onAdd} aria-label="Add recipe">+</button>
    </div>
  )
}
