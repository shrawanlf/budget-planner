
type User = {
  id: string
  email: string
  name: string
  phone: string
}

export function serializeUser(user: User) {
  return JSON.stringify(user)
}

export function deserializeUser(user: string): User {
  return JSON.parse(user) as User;
}

export function saveLoggedInUser(user: User) {
  localStorage.setItem('user', serializeUser(user))
}

export function getLoggedInUser(): User | null {
  const user = localStorage.getItem('user')
  if (!user) {
    return null
  }
  return deserializeUser(user)
}
