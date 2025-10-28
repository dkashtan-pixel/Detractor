import React, { useState, useEffect } from 'react'
import { addEntry, markServed45, getStudentEntries, undoLastEntry } from '../db.js'

export default function StudentScreen({ student, onBack }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')
  const [customNote, setCustomNote] = useState('')

  useEffect(() => {
    loadEntries()
  }, [student.id])

  const loadEntries = async () => {
    try {
      const entriesList = await getStudentEntries(student.id)
      setEntries(entriesList)
    } catch (error) {
      console.error('Failed to load entries:', error)
    }
  }

  const handleAddMinutes = async (minutes, note = '') => {
    setLoading(true)
    try {
      await addEntry(student.id, minutes, note)
      loadEntries()
    } catch (error) {
      console.error('Failed to add entry:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleServe45 = async () => {
    setLoading(true)
    try {
      await markServed45(student.id)
      loadEntries()
    } catch (error) {
      console.error('Failed to mark served:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUndo = async () => {
    setLoading(true)
    try {
      await undoLastEntry(student.id)
      loadEntries()
    } catch (error) {
      console.error('Failed to undo:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomSubmit = async (e) => {
    e.preventDefault()
    const minutes = parseInt(customMinutes)
    if (minutes && minutes !== 0) {
      await handleAddMinutes(minutes, customNote)
      setCustomMinutes('')
      setCustomNote('')
      setShowCustomInput(false)
    }
  }

  const getOwedCount = () => Math.floor(student.totalMinutes / 45)
  const getProgress = () => student.totalMinutes % 45
  const getProgressColor = () => {
    if (student.totalMinutes >= 45) return 'text-red-400'
    if (student.totalMinutes >= 30) return 'text-yellow-400'
    return 'text-green-400'
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="p-4">
      <header className="py-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-neutral-400 hover:text-neutral-200 text-xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-semibold">{student.name}</h1>
            <p className="text-sm text-neutral-400">
              <span className={getProgressColor()}>
                {student.totalMinutes} minutes
              </span>
              {getOwedCount() > 0 && (
                <span className="ml-2 text-red-400">
                  ({getOwedCount()} × 45 owed)
                </span>
              )}
              {getProgress() > 0 && (
                <span className="ml-2">
                  ({getProgress()}/45)
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      <main className="py-6">
        {/* Action Buttons */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={() => handleAddMinutes(1)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 rounded-lg font-medium"
            >
              +1
            </button>
            <button
              onClick={() => handleAddMinutes(5)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 rounded-lg font-medium"
            >
              +5
            </button>
            <button
              onClick={() => handleAddMinutes(10)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 rounded-lg font-medium"
            >
              +10
            </button>
            <button
              onClick={() => handleAddMinutes(15)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 rounded-lg font-medium"
            >
              +15
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={() => handleAddMinutes(-1)}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white py-3 rounded-lg font-medium"
            >
              -1
            </button>
            <button
              onClick={() => handleAddMinutes(-5)}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white py-3 rounded-lg font-medium"
            >
              -5
            </button>
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 rounded-lg font-medium col-span-2"
            >
              Custom ±
            </button>
          </div>

          {showCustomInput && (
            <div className="mb-3 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
              <form onSubmit={handleCustomSubmit} className="space-y-3">
                <input
                  type="number"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Minutes (+ or -)"
                  className="w-full bg-neutral-800 text-neutral-100 px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="w-full bg-neutral-800 text-neutral-100 px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false)
                      setCustomMinutes('')
                      setCustomNote('')
                    }}
                    className="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {getOwedCount() > 0 && (
            <button
              onClick={handleServe45}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white py-3 rounded-lg font-medium mb-3"
            >
              Mark 45 Minutes Served
            </button>
          )}

          <button
            onClick={handleUndo}
            disabled={loading || entries.length === 0}
            className="w-full bg-neutral-600 hover:bg-neutral-700 disabled:bg-neutral-800 text-white py-3 rounded-lg font-medium"
          >
            Undo Last Change
          </button>
        </div>

        {/* History */}
        <div>
          <h3 className="text-lg font-medium mb-3">History</h3>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <p>No entries yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg border ${
                    entry.deltaMinutes > 0 
                      ? 'bg-green-900/20 border-green-800' 
                      : entry.deltaMinutes < 0 
                      ? 'bg-red-900/20 border-red-800'
                      : 'bg-neutral-900 border-neutral-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {entry.deltaMinutes > 0 ? '+' : ''}{entry.deltaMinutes} minutes
                        {entry.served45 && <span className="ml-2 text-orange-400">(Served)</span>}
                      </div>
                      {entry.note && (
                        <div className="text-sm text-neutral-400 mt-1">{entry.note}</div>
                      )}
                    </div>
                    <div className="text-sm text-neutral-400">
                      {formatDate(entry.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
