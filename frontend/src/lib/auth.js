export function saveAuth(token, user) {
  localStorage.setItem('stoic_token', token);
  localStorage.setItem('stoic_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('stoic_token');
  localStorage.removeItem('stoic_user');
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('stoic_user'));
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!localStorage.getItem('stoic_token');
}
