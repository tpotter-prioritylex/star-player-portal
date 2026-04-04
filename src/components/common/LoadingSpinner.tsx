import React from 'react'

interface LoadingSpinnerProps {
  className?: string
}

export function LoadingSpinner({ className = "h-8 w-8" }: LoadingSpinnerProps) {
  return (
    <div className={`animate-spin rounded-full border-b-2 border-navy ${className}`}></div>
  )
}