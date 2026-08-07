import { API_URL } from "../constants";

export function buildUrl(path: string) {
  const url = new URL(path, API_URL)
  return url.toString()
}

export async function authFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')

  return fetch(buildUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
      ...options.headers,
    },
  })
}
