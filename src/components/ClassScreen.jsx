import React, { useState, useEffect } from 'react'
import { getStudentsByClass, addStudent, addEntry } from '../db.js'

export default function ClassScreen({ classData, onStudentSelect, onBack }) {
  const [students, setStudents] = useState([])
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [newStudentName, setNewStudentName] = useState('')
  const [sortOrder, setSortOrder] = useState('desc') // desc or asc
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStudents()
  }, [classData.id])

  const loadStudents = async () => {
    try {
      const studentsList = await getStudentsByClass(classData.id)
      setStudents(studentsList)
    } catch (error) {
      console.error('Failed to load students:', error)
    }
  }

  const handleAddStudent = async (e) => {
    e.preventDefault()
    if (newStudentName.trim()) {
      try {
        await addStudent(classData.id, newStudentName.trim())
        setNewStudentName('')
        setShowAddStudent(false)
        loadStudents()
      } catch (error) {
        console.error('Failed to add student:', error)
      }
    }
  }

  const handleQuickAdd = async (studentId, minutes) => {
    setLoading(true)
    try {
      await addEntry(studentId, minutes)
      loadStudents()
    } catch (error) {
      console.error('Failed to add minutes:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortedStudents = [...students].sort((a, b) => {
    if (sortOrder === 'desc') {
      return b.totalMinutes - a.totalMinutes
    } else {
      return a.totalMinutes - b.totalMinutes
    }
  })

  const getProgressColor = (minutes) => {
    if (minutes >= 45) return 'text-red-400'
    if (minutes >= 30) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getOwedCount = (minutes) => Math.floor(minutes / 45)
  const getProgress = (minutes) => minutes % 45

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
            <h1 className="text-xl font-semibold">{classData.name}</h1>
            <p className="text-sm text-neutral-400">{students.length} students</p>
          </div>
        </div>
      </header>

      <main className="py-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowAddStudent(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Student
          </button>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            Sort: {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        {showAddStudent && (
          <div className="mb-4 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
            <form onSubmit={handleAddStudent} className="flex gap-2">
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Student name"
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
                  setShowAddStudent(false)
                  setNewStudentName('')
                }}
                className="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {students.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <p>No students yet.</p>
            <p className="text-sm mt-2">Add your first student to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedStudents.map((student) => (
              <div
                key={student.id}
                className="p-4 bg-neutral-900 rounded-lg border border-neutral-800"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onStudentSelect(student)}
                  >
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-neutral-400 mt-1">
                      <span className={getProgressColor(student.totalMinutes)}>
                        {student.totalMinutes} minutes
                      </span>
                      {getOwedCount(student.totalMinutes) > 0 && (
                        <span className="ml-2 text-red-400">
                          ({getOwedCount(student.totalMinutes)} × 45 owed)
                        </span>
                      )}
                      {getProgress(student.totalMinutes) > 0 && (
                        <span className="ml-2">
                          ({getProgress(student.totalMinutes)}/45)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleQuickAdd(student.id, 5)}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-3 py-1 rounded text-sm font-medium ml-2"
                  >
                    +5
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
