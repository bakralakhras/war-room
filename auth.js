// War Room — Auth
// Hardcoded premium users: zechi, omen (SHA-256 hashed passwords)
// Registered users stored in localStorage.
// Exposes window.Auth = { session, login, register, logout, requireAuth }

(function () {
  const SESSION_KEY = 'warroom_session';
  const USERS_KEY   = 'warroom_users';

  // ── Hardcoded premium users (password = username) ─────────────
  const PREMIUM = {
    zechi: { hash: '2b1ca495e0c93febb3a256c94310aa7bb6cc05c2b7266c488f300962f8962b3e', displayName: 'Zechi', tier: 'premium' },
    omen:  { hash: 'e2f26e98726bde0e9a893dda21a7cede7fe27f9221922aab442feae55af04d0b', displayName: 'Omen',  tier: 'premium' },
  };

  // ── Hash helper (SHA-256 via Web Crypto) ──────────────────────
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ── Registered users (localStorage) ──────────────────────────
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // ── Session ───────────────────────────────────────────────────
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
  }

  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  // ── Public API ────────────────────────────────────────────────
  window.Auth = {
    session: getSession(),

    // Login — checks premium users first, then localStorage registrations
    async login(username, password) {
      const key = username.trim().toLowerCase();
      const hash = await sha256(password);

      // Premium users
      if (PREMIUM[key]) {
        if (hash !== PREMIUM[key].hash) return { ok: false, error: 'Incorrect password.' };
        const user = { username: key, displayName: PREMIUM[key].displayName, tier: 'premium' };
        setSession(user);
        window.Auth.session = user;
        return { ok: true, user };
      }

      // Registered users
      const users = getUsers();
      if (!users[key]) return { ok: false, error: 'No account found. Register below.' };
      if (hash !== users[key].hash) return { ok: false, error: 'Incorrect password.' };
      const user = { username: key, displayName: users[key].displayName, tier: users[key].tier || 'free' };
      setSession(user);
      window.Auth.session = user;
      return { ok: true, user };
    },

    // Register — blocked for reserved premium usernames
    async register(username, password, displayName) {
      const key = username.trim().toLowerCase();

      if (PREMIUM[key]) return { ok: false, error: 'That username is reserved.' };
      if (key.length < 3)  return { ok: false, error: 'Username must be at least 3 characters.' };
      if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

      const users = getUsers();
      if (users[key]) return { ok: false, error: 'Username already taken.' };

      const hash = await sha256(password);
      users[key] = { hash, displayName: displayName || username, tier: 'free' };
      saveUsers(users);

      const user = { username: key, displayName: users[key].displayName, tier: 'free' };
      setSession(user);
      window.Auth.session = user;
      return { ok: true, user };
    },

    logout() {
      clearSession();
      window.Auth.session = null;
      window.location.href = 'login.html';
    },

    // Call at the top of any protected page — redirects if not logged in
    requireAuth() {
      if (!getSession()) {
        window.location.href = 'login.html';
        return false;
      }
      window.Auth.session = getSession();
      return true;
    },
  };
})();
