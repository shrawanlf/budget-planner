import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  element: React.ReactElement
}

export function ProtectedRoute({ element }: ProtectedRouteProps) {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/" replace />
  }

  return element
}
