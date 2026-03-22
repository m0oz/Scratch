import { useState } from 'react'
import { Recipe, loadRecipes, saveRecipes } from './types'
import RecipeList from './components/RecipeList'
import RecipeDetail from './components/RecipeDetail'
import RecipeForm from './components/RecipeForm'

type View =
  | { name: 'list' }
  | { name: 'detail'; id: string }
  | { name: 'form'; id?: string }

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>(loadRecipes)
  const [view, setView] = useState<View>({ name: 'list' })

  function updateRecipes(updated: Recipe[]) {
    setRecipes(updated)
    saveRecipes(updated)
  }

  if (view.name === 'detail') {
    const recipe = recipes.find(r => r.id === view.id)
    if (!recipe) return <div>Not found.</div>
    return (
      <RecipeDetail
        recipe={recipe}
        onBack={() => setView({ name: 'list' })}
        onEdit={() => setView({ name: 'form', id: recipe.id })}
        onDelete={() => {
          updateRecipes(recipes.filter(r => r.id !== recipe.id))
          setView({ name: 'list' })
        }}
      />
    )
  }

  if (view.name === 'form') {
    const recipe = view.id ? recipes.find(r => r.id === view.id) : undefined
    return (
      <RecipeForm
        recipe={recipe}
        onSave={saved => {
          updateRecipes(
            recipe
              ? recipes.map(r => r.id === saved.id ? saved : r)
              : [...recipes, saved]
          )
          setView(recipe ? { name: 'detail', id: saved.id } : { name: 'list' })
        }}
        onCancel={() =>
          setView(recipe ? { name: 'detail', id: recipe.id } : { name: 'list' })
        }
      />
    )
  }

  return (
    <RecipeList
      recipes={recipes}
      onSelect={id => setView({ name: 'detail', id })}
      onAdd={() => setView({ name: 'form' })}
    />
  )
}
