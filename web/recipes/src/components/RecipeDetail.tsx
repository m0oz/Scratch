import { useState } from 'react'
import { Recipe, formatTime, scaleAmount } from '../types'

interface Props {
  recipe: Recipe
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function RecipeDetail({ recipe, onBack, onEdit, onDelete }: Props) {
  const [servings, setServings] = useState(recipe.servings)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const scale = servings / recipe.servings

  return (
    <div>
      <header className="header">
        <button className="btn-icon btn-back" onClick={onBack}>← Back</button>
        <button className="btn-icon" onClick={onEdit}>Edit</button>
      </header>

      <div className="detail">
        <div className="detail-header">
          <span className="detail-category">{recipe.category}</span>
          <h1 className="detail-name">{recipe.name}</h1>
          {recipe.description && (
            <p className="detail-description">{recipe.description}</p>
          )}
        </div>

        <div className="detail-stats">
          {recipe.prepTime > 0 && (
            <div className="stat-card">
              <div className="stat-value">{formatTime(recipe.prepTime)}</div>
              <div className="stat-label">Prep</div>
            </div>
          )}
          {recipe.cookTime > 0 && (
            <div className="stat-card">
              <div className="stat-value">{formatTime(recipe.cookTime)}</div>
              <div className="stat-label">Cook</div>
            </div>
          )}
          {(recipe.prepTime > 0 || recipe.cookTime > 0) && (
            <div className="stat-card">
              <div className="stat-value">{formatTime(recipe.prepTime + recipe.cookTime)}</div>
              <div className="stat-label">Total</div>
            </div>
          )}
        </div>

        {recipe.ingredients.length > 0 && (
          <>
            <div className="section-title">Ingredients</div>

            <div className="servings-scaler">
              <span className="servings-label">Servings</span>
              <button
                className="servings-btn"
                onClick={() => setServings(s => Math.max(1, s - 1))}
                disabled={servings <= 1}
              >−</button>
              <span className="servings-count">{servings}</span>
              <button
                className="servings-btn"
                onClick={() => setServings(s => s + 1)}
              >+</button>
            </div>

            <div className="ingredient-list">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="ingredient-item">
                  <span className="ingredient-amount">
                    {ing.amount ? scaleAmount(ing.amount, scale) : ''}{' '}
                    {ing.unit}
                  </span>
                  <span>{ing.name}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {recipe.instructions.length > 0 && (
          <>
            <div className="section-title">Instructions</div>
            <div className="instruction-list">
              {recipe.instructions.map((step, i) => (
                <div key={i} className="instruction-item">
                  <div className="instruction-num">{i + 1}</div>
                  <div className="instruction-text">{step}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="detail-actions">
          <button className="btn btn-primary" onClick={onEdit}>Edit Recipe</button>
          {confirmDelete ? (
            <button className="btn btn-danger" onClick={onDelete}>Confirm Delete</button>
          ) : (
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          )}
        </div>
      </div>
    </div>
  )
}
