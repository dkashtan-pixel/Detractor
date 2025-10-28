import React, { useState, useEffect } from 'react'
import { getClasses, addClass, getStudentsByClass, addStudent, addEntry, markServed45, importStudents, clearStudentsFromClass, getStudentEntries, undoLastEntry } from './db.js'
import { t } from './translations.js'

export default function App() {
  const [classes, setClasses] = useState([])
  const [currentScreen, setCurrentScreen] = useState('home')
  const [selectedClass, setSelectedClass] = useState(null)
  const [students, setStudents] = useState([])
  const [showAddClass, setShowAddClass] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [newStudentName, setNewStudentName] = useState('')
  
  // New state for enhanced features
  const [showImportStudents, setShowImportStudents] = useState(false)
  const [importText, setImportText] = useState('')
  const [showMinuteEntry, setShowMinuteEntry] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [customMinutes, setCustomMinutes] = useState('')
  const [entryNote, setEntryNote] = useState('')
  
  // Student detail screen state
  const [studentEntries, setStudentEntries] = useState([])
  
  // PWA installation state
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  
  // Language state
  const [language, setLanguage] = useState('he') // Default to Hebrew

  useEffect(() => {
    loadClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadStudents()
    }
  }, [selectedClass])

  // PWA installation setup
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      console.log('Install prompt available')
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    const handleAppInstalled = () => {
      console.log('App installed')
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      console.log('App already installed')
      setShowInstallPrompt(false)
    }

    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      console.log('Service worker supported')
    }

    // Trigger engagement for PWA installation criteria
    const handleUserInteraction = () => {
      console.log('User interaction detected - PWA engagement')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('click', handleUserInteraction)
    window.addEventListener('scroll', handleUserInteraction)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('click', handleUserInteraction)
      window.removeEventListener('scroll', handleUserInteraction)
    }
  }, [])

  const loadClasses = async () => {
    try {
      const classesList = await getClasses()
      setClasses(classesList)
    } catch (error) {
      console.error('Failed to load classes:', error)
    }
  }

  const loadStudents = async () => {
    if (!selectedClass) return
    try {
      const studentsList = await getStudentsByClass(selectedClass.id)
      setStudents(studentsList)
    } catch (error) {
      console.error('Failed to load students:', error)
    }
  }

  const loadStudentEntries = async (studentId) => {
    try {
      const entries = await getStudentEntries(studentId)
      setStudentEntries(entries)
    } catch (error) {
      console.error('Failed to load student entries:', error)
    }
  }

  const handleAddClass = async (e) => {
    e.preventDefault()
    if (newClassName.trim()) {
      try {
        await addClass(newClassName.trim())
        setNewClassName('')
        setShowAddClass(false)
        loadClasses()
      } catch (error) {
        console.error('Failed to add class:', error)
      }
    }
  }

  const handleAddStudent = async (e) => {
    e.preventDefault()
    if (newStudentName.trim() && selectedClass) {
      try {
        await addStudent(selectedClass.id, newStudentName.trim())
        setNewStudentName('')
        setShowAddStudent(false)
        loadStudents()
      } catch (error) {
        console.error('Failed to add student:', error)
      }
    }
  }

  const handleQuickAdd = async (studentId, minutes) => {
    try {
      await addEntry(studentId, minutes)
      loadStudents()
      
      // If we're on student detail screen, refresh entries and update selected student
      if (currentScreen === 'student-detail' && selectedStudent && selectedStudent.id === studentId) {
        await loadStudentEntries(studentId)
        // Update selectedStudent with new total
        const updatedStudent = await getStudentsByClass(selectedClass.id)
        const student = updatedStudent.find(s => s.id === studentId)
        if (student) {
          setSelectedStudent(student)
        }
      }
    } catch (error) {
      console.error('Failed to add minutes:', error)
    }
  }

  const handleImportStudents = async (e) => {
    e.preventDefault()
    if (!selectedClass || !importText.trim()) return
    
    try {
      // Parse student names from text (one per line or comma-separated)
      const studentNames = importText
        .split(/[,\n]/)
        .map(name => name.trim())
        .filter(name => name.length > 0)
      
      if (studentNames.length === 0) return
      
      // Clear existing students and import new ones
      await clearStudentsFromClass(selectedClass.id)
      await importStudents(selectedClass.id, studentNames)
      
      setImportText('')
      setShowImportStudents(false)
      loadStudents()
    } catch (error) {
      console.error('Failed to import students:', error)
    }
  }

  const handleCustomMinuteEntry = async (e) => {
    e.preventDefault()
    if (!selectedStudent || !customMinutes) return
    
    try {
      const minutes = parseInt(customMinutes)
      if (isNaN(minutes) || minutes <= 0) return
      
      await addEntry(selectedStudent.id, minutes, entryNote.trim())
      setCustomMinutes('')
      setEntryNote('')
      setShowMinuteEntry(false)
      
      // Refresh data based on current screen
      loadStudents()
      if (currentScreen === 'student-detail') {
        await loadStudentEntries(selectedStudent.id)
        // Update selectedStudent with new total
        const updatedStudent = await getStudentsByClass(selectedClass.id)
        const student = updatedStudent.find(s => s.id === selectedStudent.id)
        if (student) {
          setSelectedStudent(student)
        }
      } else {
        setSelectedStudent(null)
      }
    } catch (error) {
      console.error('Failed to add minutes:', error)
    }
  }

  const handleMarkServed = async (studentId) => {
    try {
      await markServed45(studentId)
      loadStudents()
      
      // If we're on student detail screen, refresh entries and update selected student
      if (currentScreen === 'student-detail' && selectedStudent && selectedStudent.id === studentId) {
        await loadStudentEntries(studentId)
        // Update selectedStudent with new total
        const updatedStudent = await getStudentsByClass(selectedClass.id)
        const student = updatedStudent.find(s => s.id === studentId)
        if (student) {
          setSelectedStudent(student)
        }
      }
    } catch (error) {
      console.error('Failed to mark as served:', error)
    }
  }

  const handleUndoLastEntry = async (studentId) => {
    try {
      await undoLastEntry(studentId)
      loadStudents()
      if (selectedStudent && selectedStudent.id === studentId) {
        loadStudentEntries(studentId)
      }
    } catch (error) {
      console.error('Failed to undo last entry:', error)
    }
  }

  const handleStudentClick = async (student) => {
    setSelectedStudent(student)
    await loadStudentEntries(student.id)
    setCurrentScreen('student-detail')
  }

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          setShowInstallPrompt(false)
          console.log('PWA installed successfully')
        } else {
          console.log('PWA installation declined')
        }
        setDeferredPrompt(null)
      } catch (error) {
        console.error('Install prompt failed:', error)
        // Fallback: show instructions for manual installation
        alert('Install prompt failed. Please use your browser menu to "Add to Home Screen"')
      }
    } else {
      // No deferred prompt available, show manual instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isAndroid = /Android/.test(navigator.userAgent)
      
      if (isIOS) {
        alert('To install this app:\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add"')
      } else if (isAndroid) {
        alert('To install this app:\n1. Tap the menu (3 dots) in your browser\n2. Tap "Add to Home Screen" or "Install App"\n3. Tap "Add" or "Install"')
      } else {
        alert('To install this app, look for "Add to Home Screen" or "Install App" in your browser menu.')
      }
    }
  }

  const getOwedCount = (minutes) => Math.floor(minutes / 45)
  const getProgress = (minutes) => minutes % 45

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`min-h-dvh bg-neutral-950 text-neutral-100 ${language === 'he' ? 'rtl' : 'ltr'}`} dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-xl p-4">
        {currentScreen === 'student-detail' && selectedStudent ? (
          // Student Detail Screen
          <>
            <header className="py-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentScreen('class')}
                  className="text-neutral-400 hover:text-neutral-200 text-xl"
                >
                  {t('back', language)}
                </button>
                <div>
                  <h1 className="text-xl font-semibold">{selectedStudent.name}</h1>
                  <p className="text-sm text-neutral-400">
                    <span className={selectedStudent.totalMinutes >= 45 ? 'text-red-400' : selectedStudent.totalMinutes >= 30 ? 'text-yellow-400' : 'text-green-400'}>
                      {t('minutes.total', language, { minutes: selectedStudent.totalMinutes })}
                    </span>
                    {getOwedCount(selectedStudent.totalMinutes) > 0 && (
                      <span className="ml-2 text-red-400">
                        {t('minutes.owed', language, { count: getOwedCount(selectedStudent.totalMinutes) })}
                      </span>
                    )}
                    {getProgress(selectedStudent.totalMinutes) > 0 && (
                      <span className="ml-2">
                        {t('minutes.progress', language, { progress: getProgress(selectedStudent.totalMinutes) })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </header>

            <main className="py-6">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => handleQuickAdd(selectedStudent.id, 5)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {t('minutes.add.5', language)}
                </button>
                <button
                  onClick={() => {
                    setShowMinuteEntry(true)
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {t('minutes.add.custom', language)}
                </button>
                {getOwedCount(selectedStudent.totalMinutes) > 0 && (
                  <button
                    onClick={() => handleMarkServed(selectedStudent.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    {t('minutes.served', language)}
                  </button>
                )}
                {studentEntries.length > 0 && (
                  <button
                    onClick={() => handleUndoLastEntry(selectedStudent.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    {t('minutes.undo', language)}
                  </button>
                )}
              </div>

              <h2 className="text-lg font-medium mb-4">{t('student.detail.title', language)}</h2>
              {studentEntries.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <p>{t('student.detail.none', language)}</p>
                  <p className="text-sm mt-2">{t('student.detail.none.subtitle', language)}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {studentEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-4 rounded-lg border ${
                        entry.served45 
                          ? 'bg-green-900 border-green-800' 
                          : entry.deltaMinutes > 0 
                            ? 'bg-red-900 border-red-800' 
                            : 'bg-blue-900 border-blue-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              entry.deltaMinutes > 0 ? 'text-red-300' : 'text-blue-300'
                            }`}>
                              {entry.deltaMinutes > 0 ? t('entry.added', language, { minutes: entry.deltaMinutes }) : t('entry.added', language, { minutes: entry.deltaMinutes })}
                            </span>
                            {entry.served45 && (
                              <span className="text-green-300 text-sm">{t('entry.served', language)}</span>
                            )}
                          </div>
                          {entry.note && (
                            <p className="text-sm text-neutral-300 mt-1">{entry.note}</p>
                          )}
                          <p className="text-xs text-neutral-400 mt-1">
                            {formatDate(entry.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </>
        ) : !selectedClass ? (
          // Home Screen
          <>
            <header className="py-4 border-b border-neutral-800">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-semibold">{t('app.title', language)}</h1>
                  <p className="text-sm text-neutral-400">{t('app.subtitle', language)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
                    className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    {language === 'he' ? 'EN' : 'עב'}
                  </button>
                  {(showInstallPrompt || (!window.matchMedia('(display-mode: standalone)').matches && 'serviceWorker' in navigator)) && (
                    <button
                      onClick={handleInstallApp}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      {t('install.button', language)}
                    </button>
                  )}
                </div>
              </div>
            </header>

            <main className="py-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">{t('classes.title', language)}</h2>
                <button 
                  onClick={() => setShowAddClass(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {t('classes.add', language)}
                </button>
              </div>

              {showAddClass && (
                <div className="mb-4 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
                  <form onSubmit={handleAddClass} className="flex gap-2">
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder={t('classes.name.placeholder', language)}
                      className="flex-1 bg-neutral-800 text-neutral-100 px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      {t('classes.add.button', language)}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddClass(false)
                        setNewClassName('')
                      }}
                      className="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      {t('classes.cancel.button', language)}
                    </button>
                  </form>
                </div>
              )}

              {classes.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <p>{t('classes.none', language)}</p>
                  <p className="text-sm mt-2">{t('classes.none.subtitle', language)}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {classes.map((classItem) => (
                    <button
                      key={classItem.id}
                      onClick={() => setSelectedClass(classItem)}
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
          </>
        ) : (
          // Class Screen
          <>
            <header className="py-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedClass(null)}
                  className="text-neutral-400 hover:text-neutral-200 text-xl"
                >
                  {t('back', language)}
                </button>
                <div>
                  <h1 className="text-xl font-semibold">{selectedClass.name}</h1>
                  <p className="text-sm text-neutral-400">{t('students.count', language, { count: students.length })}</p>
                </div>
              </div>
            </header>

            <main className="py-6">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setShowImportStudents(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {t('students.import', language)}
                </button>
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {t('students.add.single', language)}
                </button>
              </div>

              {showImportStudents && (
                <div className="mb-4 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-neutral-200 mb-2">{t('students.import', language)}</h3>
                    <p className="text-xs text-neutral-400 mb-2">
                      {t('students.import.instructions', language)}
                    </p>
                  </div>
                  <form onSubmit={handleImportStudents}>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder={t('students.import.placeholder', language)}
                      className="w-full bg-neutral-800 text-neutral-100 px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:border-blue-500 h-24 resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                      >
                        {t('students.import.button', language)}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowImportStudents(false)
                          setImportText('')
                        }}
                        className="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded text-sm font-medium"
                      >
                        {t('classes.cancel.button', language)}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {showAddStudent && (
                <div className="mb-4 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
                  <form onSubmit={handleAddStudent} className="flex gap-2">
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder={t('students.name.placeholder', language)}
                      className="flex-1 bg-neutral-800 text-neutral-100 px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      {t('classes.add.button', language)}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddStudent(false)
                        setNewStudentName('')
                      }}
                      className="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      {t('classes.cancel.button', language)}
                    </button>
                  </form>
                </div>
              )}

              {students.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <p>{t('students.none', language)}</p>
                  <p className="text-sm mt-2">{t('students.none.subtitle', language)}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="p-4 bg-neutral-900 rounded-lg border border-neutral-800"
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleStudentClick(student)}
                        >
                          <div className="font-medium hover:text-blue-400 transition-colors">{student.name}</div>
                          <div className="text-sm text-neutral-400 mt-1">
                            <span className={student.totalMinutes >= 45 ? 'text-red-400' : student.totalMinutes >= 30 ? 'text-yellow-400' : 'text-green-400'}>
                              {t('minutes.total', language, { minutes: student.totalMinutes })}
                            </span>
                            {getOwedCount(student.totalMinutes) > 0 && (
                              <span className="ml-2 text-red-400">
                                {t('minutes.owed', language, { count: getOwedCount(student.totalMinutes) })}
                              </span>
                            )}
                            {getProgress(student.totalMinutes) > 0 && (
                              <span className="ml-2">
                                {t('minutes.progress', language, { progress: getProgress(student.totalMinutes) })}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleQuickAdd(student.id, 5)
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium"
                          >
                            {t('minutes.add.5', language)}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedStudent(student)
                              setShowMinuteEntry(true)
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs font-medium"
                          >
                            {t('minutes.add.custom', language)}
                          </button>
                          {getOwedCount(student.totalMinutes) > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkServed(student.id)
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium"
                            >
                              {t('minutes.served', language)}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </>
        )}
        
        {/* Custom Minute Entry Modal */}
        {showMinuteEntry && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">{t('student.detail.add.title', language, { name: selectedStudent.name })}</h3>
              <form onSubmit={handleCustomMinuteEntry}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-200 mb-2">
                    {t('student.detail.add.minutes.label', language)}
                  </label>
                  <input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder={t('student.detail.add.minutes.placeholder', language)}
                    className="w-full bg-neutral-800 text-neutral-100 px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:border-blue-500"
                    autoFocus
                    min="1"
                    max="60"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-200 mb-2">
                    {t('student.detail.add.note.label', language)}
                  </label>
                  <input
                    type="text"
                    value={entryNote}
                    onChange={(e) => setEntryNote(e.target.value)}
                    placeholder={t('student.detail.add.note.placeholder', language)}
                    className="w-full bg-neutral-800 text-neutral-100 px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
                  >
                    {t('student.detail.add.button', language)}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMinuteEntry(false)
                      setSelectedStudent(null)
                      setCustomMinutes('')
                      setEntryNote('')
                    }}
                    className="flex-1 bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded font-medium"
                  >
                    {t('classes.cancel.button', language)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



