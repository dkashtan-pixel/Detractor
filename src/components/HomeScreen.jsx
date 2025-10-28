import React, { useState } from 'react'
import { addClass } from '../db.js'

export default function HomeScreen({ classes, onClassSelect, onRefresh }) {
  const [showAddClass, setShowAddClass] = useState(false)
  const [newClassName, setNewClassName] = useState('')

  const handleAddClass = async (e) => {
    e.preventDefault()
    if (newClassName.trim()) {
      try {
        await addClass(newClassName.trim())
        setNewClassName('')
        setShowAddClass(false)
        onRefresh()
      } catch (error) {
        console.error('Failed to add class:', error)
      }
    }
  }

  return (
    <div className="p-4">
      <header className="py-4 border-b border-neutral-800">
        <h1 className="text-xl font-semibold">Detention Tracker</h1>
        <p className="text-sm text-neutral-400">Local-only, offline-ready</p>
      </header>

      <main className="py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Classes</h2>
          <button
            onClick={() => setShowAddClass(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Class
          </button>
        </div>

        {showAddClass && (
          <div className="mb-4 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
            <form onSubmit={handleAddClass} className="flex gap-2">
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Class name (e.g., Math 101)"
                className="flex-1 bg-neutral-800 text-neutral-100 px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddClass(false)
                  setNewClassName('')
                }}
                className="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {classes.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <p>No classes yet.</p>
            <p className="text-sm mt-2">Add your first class to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {classes.map((classItem) => (
              <button
                key={classItem.id}
                onClick={() => onClassSelect(classItem)}
                className="w-full text-left p-4 bg-neutral-900 hover:bg-neutral-800 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{classItem.name}</span>
                  <span className="text-neutral-400 text-sm">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
