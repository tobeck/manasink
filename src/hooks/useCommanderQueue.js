import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchRandomCommanders } from '../api'
import { QUEUE_SIZE } from '../constants'

export function useCommanderQueue(filters) {
  const [queue, setQueue] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const isFetching = useRef(false)
  const filtersRef = useRef(filters)

  // Keep filters ref in sync
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  const fillQueue = useCallback(async () => {
    if (isFetching.current) return
    isFetching.current = true
    setIsLoading(true)
    setError(null)

    try {
      const needed = QUEUE_SIZE - queue.length
      const commanders = await fetchRandomCommanders(filtersRef.current, Math.max(needed, 1))

      if (commanders.length === 0) {
        throw new Error('Could not fetch commanders')
      }

      setQueue(prev => [...prev, ...commanders].slice(0, QUEUE_SIZE))
    } catch (e) {
      setError(e.message)
    } finally {
      setIsLoading(false)
      isFetching.current = false
    }
  }, [queue.length])

  // Initial load
  useEffect(() => {
    if (queue.length === 0 && !isFetching.current) {
      fillQueue()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refill when queue gets low
  useEffect(() => {
    if (queue.length > 0 && queue.length < QUEUE_SIZE && !isFetching.current) {
      fillQueue()
    }
  }, [queue.length, fillQueue])

  const nextCommander = useCallback(() => {
    setQueue(prev => prev.slice(1))
  }, [])

  const prependCommander = useCallback((commander) => {
    setQueue(prev => [commander, ...prev])
  }, [])

  const resetQueue = useCallback(() => {
    setQueue([])
    isFetching.current = false
    setTimeout(fillQueue, 0)
  }, [fillQueue])

  return {
    currentCommander: queue[0] || null,
    nextUpCommander: queue[1] || null, // For preloading
    nextCommander,
    prependCommander,
    resetQueue,
    isLoading: isLoading && queue.length === 0,
    error,
    retry: resetQueue,
  }
}
