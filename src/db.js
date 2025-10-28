import Dexie from 'dexie'

const db = new Dexie('DetentionTracker')

db.version(1).stores({
  classes: '++id, name, createdAt, updatedAt',
  students: '++id, classId, name, totalMinutes, createdAt, updatedAt',
  entries: '++id, studentId, timestamp, deltaMinutes, note, served45'
})

export default db

// Helper functions
export const getClasses = () => db.classes.orderBy('name').toArray()

export const getStudentsByClass = (classId) => 
  db.students.where('classId').equals(classId).toArray()

export const addClass = (name) => 
  db.classes.add({ name, createdAt: Date.now(), updatedAt: Date.now() })

export const addStudent = (classId, name) => 
  db.students.add({ 
    classId, 
    name: name.trim(), 
    totalMinutes: 0, 
    createdAt: Date.now(), 
    updatedAt: Date.now() 
  })

export const addEntry = async (studentId, deltaMinutes, note = '') => {
  const entry = await db.entries.add({
    studentId,
    timestamp: Date.now(),
    deltaMinutes,
    note: note.trim(),
    served45: false
  })
  
  // Update student's total minutes
  const student = await db.students.get(studentId)
  if (student) {
    await db.students.update(studentId, {
      totalMinutes: student.totalMinutes + deltaMinutes,
      updatedAt: Date.now()
    })
  }
  
  return entry
}

export const markServed45 = async (studentId) => {
  // Add entry for serving 45 minutes
  await addEntry(studentId, -45, 'Served 45 minutes detention')
  
  // Mark the entry as served
  const entries = await db.entries.where('studentId').equals(studentId).toArray()
  const latestEntry = entries.sort((a, b) => b.timestamp - a.timestamp)[0]
  if (latestEntry) {
    await db.entries.update(latestEntry.id, { served45: true })
  }
}

export const getStudentEntries = (studentId) => 
  db.entries.where('studentId').equals(studentId).reverse().sortBy('timestamp')

export const undoLastEntry = async (studentId) => {
  const entries = await db.entries.where('studentId').equals(studentId).toArray()
  const lastEntry = entries.sort((a, b) => b.timestamp - a.timestamp)[0]
  
  if (lastEntry) {
    // Remove the entry
    await db.entries.delete(lastEntry.id)
    
    // Update student's total minutes
    const student = await db.students.get(studentId)
    if (student) {
      await db.students.update(studentId, {
        totalMinutes: student.totalMinutes - lastEntry.deltaMinutes,
        updatedAt: Date.now()
      })
    }
    
    return lastEntry
  }
  return null
}

// Student import functionality
export const importStudents = async (classId, studentNames) => {
  const students = studentNames.map(name => ({
    classId,
    name: name.trim(),
    totalMinutes: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }))
  
  return await db.students.bulkAdd(students)
}

export const clearStudentsFromClass = async (classId) => {
  return await db.students.where('classId').equals(classId).delete()
}

