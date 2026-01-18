import { User, Wallet, Transaction, TransactionType } from '../types';

// Base API URL: use Vite env var `VITE_API_URL` in Netlify (ex: https://api.example.com)
const API_BASE = (import.meta.env.VITE_API_URL as string) ?? '/api';
// If your backend requires sending cookies (session auth), set VITE_API_WITH_CREDENTIALS=true in Netlify env.
const WITH_CREDENTIALS = (import.meta.env.VITE_API_WITH_CREDENTIALS as string) === 'true';

const URLS = {
  USERS: `${API_BASE}`,
  WALLETS: `${API_BASE}`,
  TRANSACTIONS: `${API_BASE}`
};

// --- MOCK DATA (Mode Démo) ---
// Ces données sont utilisées si le backend est inaccessible (ex: Mixed Content, Serveur éteint)

let MOCK_USERS: User[] = [
  { id: 'u1', nom: 'Admin System', email: 'admin@studentpay.com', passwd: '1234', role: 'admin', type: 'admin', adresse: 'Localhost' },
  { id: 'u2', nom: 'Jean Étudiant', email: 'jean@univ.mg', role: 'user', type: 'student', num_CIN: '101202303', adresse: 'Campus U' },
  { id: 'u3', nom: 'Professeur Tournesol', email: 'prof@univ.mg', role: 'user', type: 'teacher', num_CIN: '505606707', adresse: 'Labo 4' }
];

let MOCK_WALLETS: Wallet[] = [
  { id: 'w_u2_01', userId: 'u2', balance: 15000, currency: 'Ar' },
  { id: 'w_u3_01', userId: 'u3', balance: 250000, currency: 'Ar' }
];

let MOCK_TRANSACTIONS: Transaction[] = [];

// Helper pour simuler une latence réseau
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function getMockResponse<T>(url: string, options: RequestInit | undefined): Promise<T> {
  console.info(`[MOCK API] Request to ${url}`);
  await delay(600); // Fake latency

  // 1. AUTH
  if (url.includes('/auth/login')) {
    const body = JSON.parse(options?.body as string || '{}');
    const user = MOCK_USERS.find(u =>
      (u.email === body.mail || u.email === body.email) &&
      (u.passwd === body["mot de passe"] || u.passwd === body.password)
    );
    if (user) return user as unknown as T;
    throw new Error("Identifiants incorrects (Mock)");
  }

  // 2. USERS
  if (url.endsWith('/users') && options?.method === 'GET') {
    return MOCK_USERS as unknown as T;
  }
  if (url.endsWith('/users') && options?.method === 'POST') {
    const body = JSON.parse(options?.body as string);
    const newUser = { ...body, id: `u${Date.now()}` };
    MOCK_USERS.push(newUser);
    return newUser as unknown as T;
  }
  if (url.includes('/users/') && options?.method === 'DELETE') {
    const id = url.split('/').pop();
    MOCK_USERS = MOCK_USERS.filter(u => u.id !== id);
    return {} as T;
  }
  if (url.includes('/users/') && options?.method === 'PUT') {
    const id = url.split('/').pop();
    const body = JSON.parse(options?.body as string);
    const idx = MOCK_USERS.findIndex(u => u.id === id);
    if (idx !== -1) {
      MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...body };
      return MOCK_USERS[idx] as unknown as T;
    }
    return {} as T;
  }

  // 3. WALLETS
  if (url.endsWith('/wallets') && options?.method === 'GET') {
    return MOCK_WALLETS as unknown as T;
  }
  if (url.endsWith('/wallets') && options?.method === 'POST') {
    const body = JSON.parse(options?.body as string);
    const newWallet = { ...body, id: `w_${Date.now()}` };
    MOCK_WALLETS.push(newWallet);
    return newWallet as unknown as T;
  }
  if (url.includes('/wallets/') && options?.method === 'DELETE') {
    const id = url.split('/').pop();
    MOCK_WALLETS = MOCK_WALLETS.filter(w => w.id !== id);
    return {} as T;
  }
  if (url.includes('/wallets/') && options?.method === 'PUT') {
    const id = url.split('/').pop();
    const body = JSON.parse(options?.body as string);
    const idx = MOCK_WALLETS.findIndex(w => w.id === id);
    if (idx !== -1) {
      MOCK_WALLETS[idx] = { ...MOCK_WALLETS[idx], ...body };
      return MOCK_WALLETS[idx] as unknown as T;
    }
    return {} as T;
  }
  if (url.includes('/wallets/user/')) {
    const userId = url.split('/').pop();
    const w = MOCK_WALLETS.find(w => w.userId === userId);
    if (w) return w as unknown as T;
    throw new Error("Wallet introuvable (Mock)");
  }

  // 4. TRANSACTIONS
  if (url.endsWith('/transactions') && options?.method === 'POST') {
    const body = JSON.parse(options?.body as string);
    const wallet = MOCK_WALLETS.find(w => w.id === body.destinationWalletId);
    if (wallet && body.type === TransactionType.DEPOSIT) {
      wallet.balance += body.amount;
    }
    const newTx = { ...body, id: `tx_${Date.now()}`, createdAt: new Date().toISOString() };
    MOCK_TRANSACTIONS.push(newTx);
    return newTx as unknown as T;
  }

  return {} as T;
}

// --- REAL API CALLER ---

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...(WITH_CREDENTIALS ? { credentials: 'include' } : {}),
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    if (response.status === 204) return {} as T;
    return response.json();

  } catch (err) {
    // INTERCEPTION DE L'ERREUR POUR BASCULER EN MODE MOCK
    console.warn(`[API] Échec de connexion à ${url}. Cause: ${err}`);
    console.warn("[API] Basculement automatique sur les données de DÉMO (Mock Data).");

    // On retourne la réponse simulée
    return getMockResponse<T>(url, options);
  }
}

export const api = {
  auth: {
    login: (email: string, pass: string) => {
      // Note: L'API attend "mail" et "mot de passe"
      return fetchJson<User>(`${URLS.USERS}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ "mail": email, "mot de passe": pass })
      });
    }
  },
  users: {
    getAll: () => fetchJson<User[]>(`${URLS.USERS}/users`),
    getById: (id: string) => fetchJson<User>(`${URLS.USERS}/users/${id}`),
    create: (user: Partial<User>) => fetchJson<User>(`${URLS.USERS}/users`, {
      method: 'POST',
      body: JSON.stringify(user)
    }),
    update: (id: string, data: Partial<User>) => fetchJson<User>(`${URLS.USERS}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => fetchJson<void>(`${URLS.USERS}/users/${id}`, {
      method: 'DELETE'
    })
  },
  wallets: {
    getAll: () => fetchJson<Wallet[]>(`${URLS.WALLETS}/wallets`),
    getByUserId: (userId: string) => fetchJson<Wallet>(`${URLS.WALLETS}/wallets/user/${userId}`),
    create: (data: { userId: string, balance: number, currency: string }) => fetchJson<Wallet>(`${URLS.WALLETS}/wallets`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: Partial<Wallet>) => fetchJson<Wallet>(`${URLS.WALLETS}/wallets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => fetchJson<void>(`${URLS.WALLETS}/wallets/${id}`, {
      method: 'DELETE'
    })
  },
  transactions: {
    create: (data: { amount: number, type: TransactionType, sourceWalletId?: string, destinationWalletId: string, description: string }) =>
      fetchJson<Transaction>(`${URLS.TRANSACTIONS}/transactions`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    getHistory: (walletId: string) => fetchJson<Transaction[]>(`${URLS.TRANSACTIONS}/transactions/${walletId}`)
  }
};