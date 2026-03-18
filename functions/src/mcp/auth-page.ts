/**
 * Renders the OAuth authorization consent page.
 * This is a self-contained HTML page that:
 * 1. Uses Firebase Auth JS SDK for login (Google Sign-In)
 * 2. Fetches user's workspaces after login
 * 3. Shows consent screen: "Allow Claude to access [workspace]?"
 * 4. POSTs back to our server with the Firebase ID token + selected workspace
 */
export function renderAuthorizePage(params: {
  clientName: string;
  callbackUrl: string;
  state: string;
  codeChallenge: string;
  redirectUri: string;
  scope: string;
  clientId: string;
}): string {
  // Read Firebase web config from env vars.
  // In deployed functions: FIREBASE_CONFIG provides projectId/storageBucket.
  // The VITE_ prefixed vars come from root .env (symlinked to functions/.env).
  // Falls back to non-prefixed names for backward compatibility.
  const autoConfig = JSON.parse(process.env.FIREBASE_CONFIG || "{}");
  const env = process.env;
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY ?? env.FIREBASE_API_KEY ?? "",
    authDomain:
      env.VITE_FIREBASE_AUTH_DOMAIN ??
      `${autoConfig.projectId ?? ""}.firebaseapp.com`,
    projectId:
      env.VITE_FIREBASE_PROJECT_ID ?? autoConfig.projectId ?? "",
    storageBucket:
      env.VITE_FIREBASE_STORAGE_BUCKET ?? autoConfig.storageBucket ?? "",
    messagingSenderId:
      env.VITE_FIREBASE_MESSAGING_SENDER_ID ??
      env.FIREBASE_MESSAGING_SENDER_ID ??
      "",
    appId: env.VITE_FIREBASE_APP_ID ?? env.FIREBASE_APP_ID ?? "",
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize ${escapeHtml(params.clientName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 2rem;
      max-width: 420px;
      width: 100%;
      margin: 1rem;
    }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #fff; }
    .subtitle { color: #888; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .step { display: none; }
    .step.active { display: block; }
    button {
      width: 100%;
      padding: 0.75rem;
      border-radius: 8px;
      border: none;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-primary {
      background: #4285f4;
      color: #fff;
    }
    .btn-primary:hover { background: #3367d6; }
    .btn-primary:disabled { background: #333; cursor: not-allowed; }
    .btn-approve {
      background: #1a73e8;
      color: #fff;
    }
    .btn-approve:hover { background: #1557b0; }
    .btn-deny {
      background: transparent;
      border: 1px solid #555;
      color: #aaa;
      margin-top: 0.5rem;
    }
    .btn-deny:hover { border-color: #888; color: #fff; }
    select {
      width: 100%;
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid #333;
      background: #111;
      color: #e0e0e0;
      font-size: 0.9375rem;
      margin-bottom: 1rem;
      appearance: auto;
    }
    .permissions {
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      font-size: 0.875rem;
    }
    .permissions li { margin: 0.5rem 0; padding-left: 0.5rem; }
    .error { color: #ef5350; font-size: 0.875rem; margin-top: 0.5rem; }
    .loading { text-align: center; color: #888; padding: 2rem 0; }
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 1rem;
    }
    .user-info img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }
    .user-info .name { font-size: 0.875rem; color: #fff; }
    .user-info .email { font-size: 0.75rem; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Step 1: Sign in with Google -->
    <div id="step-login" class="step active">
      <h1>Sign in to continue</h1>
      <p class="subtitle"><strong>${escapeHtml(params.clientName)}</strong> wants to access your workspace.</p>
      <button id="btn-google" class="btn-primary" onclick="signInWithGoogle()">
        Sign in with Google
      </button>
      <div id="login-error" class="error"></div>
    </div>

    <!-- Step 2: Loading workspaces -->
    <div id="step-loading" class="step">
      <div class="loading">Loading your workspaces...</div>
    </div>

    <!-- Step 3: Select workspace and approve -->
    <div id="step-consent" class="step">
      <h1>Authorize ${escapeHtml(params.clientName)}</h1>
      <div id="user-info" class="user-info"></div>
      <label for="workspace-select" style="font-size: 0.875rem; color: #888; display: block; margin-bottom: 0.5rem;">
        Select workspace:
      </label>
      <select id="workspace-select"></select>
      <div class="permissions">
        <strong>This will allow ${escapeHtml(params.clientName)} to:</strong>
        <ul>
          <li>Read your pages, databases, and rows</li>
          <li>Create, update, and delete pages</li>
          <li>Create databases and add rows</li>
          <li>Search your workspace</li>
        </ul>
      </div>
      <button class="btn-approve" onclick="approve()">Allow access</button>
      <button class="btn-deny" onclick="deny()">Deny</button>
      <div id="consent-error" class="error"></div>
    </div>

    <!-- Step 4: Redirecting -->
    <div id="step-redirect" class="step">
      <div class="loading">Redirecting back to ${escapeHtml(params.clientName)}...</div>
    </div>
  </div>

  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
    import { getAuth, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
    import { getFirestore, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

    const app = initializeApp(${JSON.stringify(firebaseConfig)});
    const auth = getAuth(app);
    const db = getFirestore(app);

    let currentUser = null;
    let idToken = null;

    window.signInWithGoogle = async function() {
      const btn = document.getElementById('btn-google');
      const errorEl = document.getElementById('login-error');
      btn.disabled = true;
      errorEl.textContent = '';

      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        currentUser = result.user;
        idToken = await currentUser.getIdToken();
        await loadWorkspaces();
      } catch (err) {
        errorEl.textContent = err.message || 'Sign-in failed';
        btn.disabled = false;
      }
    };

    async function loadWorkspaces() {
      showStep('step-loading');
      try {
        const q = query(
          collection(db, 'workspaces'),
          where('memberIds', 'array-contains', currentUser.uid)
        );
        const snap = await getDocs(q);
        const workspaces = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (workspaces.length === 0) {
          showStep('step-login');
          document.getElementById('login-error').textContent = 'No workspaces found for this account.';
          return;
        }

        // Populate user info
        document.getElementById('user-info').innerHTML =
          (currentUser.photoURL ? '<img src="' + escapeAttr(currentUser.photoURL) + '" alt="">' : '') +
          '<div><div class="name">' + escapeText(currentUser.displayName || 'User') + '</div>' +
          '<div class="email">' + escapeText(currentUser.email || '') + '</div></div>';

        // Populate workspace dropdown
        const sel = document.getElementById('workspace-select');
        sel.innerHTML = '';
        workspaces.forEach(ws => {
          const opt = document.createElement('option');
          opt.value = ws.id;
          opt.textContent = (ws.icon || '') + ' ' + (ws.name || 'Workspace');
          sel.appendChild(opt);
        });

        showStep('step-consent');
      } catch (err) {
        showStep('step-login');
        document.getElementById('login-error').textContent = 'Failed to load workspaces: ' + err.message;
      }
    }

    window.approve = async function() {
      const errorEl = document.getElementById('consent-error');
      errorEl.textContent = '';

      const workspaceId = document.getElementById('workspace-select').value;
      if (!workspaceId) {
        errorEl.textContent = 'Please select a workspace';
        return;
      }

      showStep('step-redirect');

      try {
        // Refresh ID token
        idToken = await currentUser.getIdToken(true);

        const resp = await fetch('${escapeHtml(params.callbackUrl)}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseIdToken: idToken,
            workspaceId: workspaceId,
            state: '${escapeJs(params.state)}',
            codeChallenge: '${escapeJs(params.codeChallenge)}',
            redirectUri: '${escapeJs(params.redirectUri)}',
            clientId: '${escapeJs(params.clientId)}',
            scope: '${escapeJs(params.scope)}',
          }),
        });

        if (resp.redirected) {
          window.location.href = resp.url;
          return;
        }

        const data = await resp.json();
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          showStep('step-consent');
          errorEl.textContent = data.error || 'Authorization failed';
        }
      } catch (err) {
        showStep('step-consent');
        errorEl.textContent = err.message || 'Authorization failed';
      }
    };

    window.deny = function() {
      const redirectUri = '${escapeJs(params.redirectUri)}';
      const state = '${escapeJs(params.state)}';
      const url = new URL(redirectUri);
      url.searchParams.set('error', 'access_denied');
      url.searchParams.set('error_description', 'User denied the authorization request');
      if (state) url.searchParams.set('state', state);
      window.location.href = url.toString();
    };

    function showStep(stepId) {
      document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
      document.getElementById(stepId).classList.add('active');
    }

    function escapeText(s) {
      const div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
    }

    function escapeAttr(s) {
      return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJs(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}
