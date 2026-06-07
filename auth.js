// War Room — Auth (Supabase)
// Replaces the old localStorage SHA-256 system.
// Exposes window.Auth = { session, init(), login(), register(), logout(), requireAuth() }

(function () {
  const DEMO_KEY = 'warroom_demo_session';
  const DEMO_BOOT_KEY = 'warroom_boot_table_demo';

  function readDemoSession() {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY) || 'null'); }
    catch { return null; }
  }

  function mapUser(user) {
    if (!user) return null;
    return {
      id:          user.id,
      username:    user.email,
      displayName: user.user_metadata?.display_name || user.email.split('@')[0],
      tier:        user.user_metadata?.tier || 'free',
    };
  }

  window.Auth = {
    session: readDemoSession(),
    _ready:  null,

    // Call once on page load. Returns a Promise that resolves to the session (or null).
    init() {
      if (this._ready) return this._ready;
      const demo = readDemoSession();
      if (demo) {
        this.session = demo;
        this._ready = Promise.resolve(demo);
        return this._ready;
      }
      const sb = window._sb;

      this._ready = sb.auth.getSession().then(({ data: { session } }) => {
        window.Auth.session = session ? mapUser(session.user) : null;
        return window.Auth.session;
      });

      sb.auth.onAuthStateChange((_event, session) => {
        window.Auth.session = session ? mapUser(session.user) : null;
      });

      return this._ready;
    },

    async login(email, password) {
      const { data, error } = await window._sb.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };
      window.Auth.session = mapUser(data.user);
      return { ok: true, user: window.Auth.session };
    },

    async register(email, password, displayName) {
      const { data, error } = await window._sb.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName || email.split('@')[0] } },
      });
      if (error) return { ok: false, error: error.message };
      // Supabase requires email confirmation by default.
      // Disable it in: Supabase Dashboard → Authentication → Email → "Enable email confirmations" → OFF
      if (!data.session) {
        return { ok: false, error: 'Check your email to confirm your account, then sign in.' };
      }
      window.Auth.session = mapUser(data.user);
      return { ok: true, user: window.Auth.session };
    },

    async logout() {
      localStorage.removeItem(DEMO_KEY);
      if (window._sb?.auth) await window._sb.auth.signOut();
      window.Auth.session = null;
      window.location.href = 'login.html';
    },

    demoLogin(role = 'dm') {
      const user = role === 'dm'
        ? { id: 'demo-ardenna-dm', username: 'ardenna.dm@war-room.demo', displayName: 'Ardenna Vale', tier: 'demo' }
        : { id: `demo-${role}`, username: `${role}@war-room.demo`, displayName: role, tier: 'demo' };
      localStorage.setItem(DEMO_KEY, JSON.stringify(user));
      localStorage.setItem(DEMO_BOOT_KEY, '1');
      window.Auth.session = user;
      window.Auth._ready = Promise.resolve(user);
      window.location.href = 'demo.html';
      return false;
    },

    // Call at the top of any protected page — redirects if not logged in.
    async requireAuth() {
      const session = await this.init();
      if (!session) {
        window.location.href = 'login.html';
        return false;
      }
      return true;
    },
  };
})();
