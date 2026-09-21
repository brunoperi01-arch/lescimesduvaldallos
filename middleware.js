// Vercel Edge Middleware — protège l'admin par HTTP Basic Auth.
// Identifiants stockés en variables d'environnement Vercel :
//   ADMIN_USER  et  ADMIN_PASS  (Settings › Environment Variables)
// NE JAMAIS committer ces valeurs dans le repo.

export const config = {
  matcher: ['/admin', '/admin/:path*', '/admin.html'],
};

export default function middleware(request) {
  const USER = process.env.ADMIN_USER;
  const PASS = process.env.ADMIN_PASS;

  // Si les variables ne sont pas configurées, on bloque par sécurité.
  if (!USER || !PASS) {
    return new Response('Configuration manquante.', { status: 503 });
  }

  const header = request.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6)); // "user:pass"
      const idx = decoded.indexOf(':');
      const u = decoded.slice(0, idx);
      const p = decoded.slice(idx + 1);
      if (safeEqual(u, USER) && safeEqual(p, PASS)) {
        return; // authentifié → laisse passer
      }
    } catch (_) { /* header mal formé → rejet ci-dessous */ }
  }

  return new Response('Authentification requise.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Administration", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}

// Comparaison à temps constant (limite les attaques temporelles).
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
