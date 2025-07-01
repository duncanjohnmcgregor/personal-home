import { useState, useCallback } from 'react'

interface UndoRedoState<T = any> {
  history: T[]
  currentIndex: number
}

interface UseUndoRedoReturn<T = any> {
  canUndo: boolean
  canRedo: boolean
  undo: () => T | null
  redo: () => T | null
  saveState: (state: T) => void
  clearHistory: () => void
  getCurrentState: () => T | null
}

export function useUndoRedo<T = any>(maxHistorySize = 50): UseUndoRedoReturn<T> {
  const [undoRedoState, setUndoRedoState] = useState<UndoRedoState<T>>({
    history: [],
    currentIndex: -1,
  })

  const canUndo = undoRedoState.currentIndex > 0
  const canRedo = undoRedoState.currentIndex < undoRedoState.history.length - 1

  const saveState = useCallback((state: T) => {
    setUndoRedoState(prev => {
      // Remove any redo history when saving a new state
      const newHistory = prev.history.slice(0, prev.currentIndex + 1)
      
      // Add the new state
      newHistory.push(state)
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
        return {
          history: newHistory,
          currentIndex: newHistory.length - 1,
        }
      }
      
      return {
        history: newHistory,
        currentIndex: newHistory.length - 1,
      }
    })
  }, [maxHistorySize])

  const undo = useCallback(() => {
    if (!canUndo) return null
    
    setUndoRedoState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex - 1,
    }))
    
    return undoRedoState.history[undoRedoState.currentIndex - 1] || null
  }, [canUndo, undoRedoState.history, undoRedoState.currentIndex])

  const redo = useCallback(() => {
    if (!canRedo) return null
    
    setUndoRedoState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
    }))
    
    return undoRedoState.history[undoRedoState.currentIndex + 1] || null
  }, [canRedo, undoRedoState.history, undoRedoState.currentIndex])

  const clearHistory = useCallback(() => {
    setUndoRedoState({
      history: [],
      currentIndex: -1,
    })
  }, [])

  const getCurrentState = useCallback(() => {
    if (undoRedoState.currentIndex >= 0 && undoRedoState.currentIndex < undoRedoState.history.length) {
      return undoRedoState.history[undoRedoState.currentIndex]
    }
    return null
  }, [undoRedoState.history, undoRedoState.currentIndex])

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    saveState,
    clearHistory,
    getCurrentState,
  }
}