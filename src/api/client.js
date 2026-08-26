const TOKEN_KEY = 'caixacerto.token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Em desenvolvimento fica vazio e as chamadas vão para `/api`, que o proxy do
 * Vite encaminha para a API local. Em produção recebe a URL pública da API
 * (ex.: https://caixa-certo-api.onrender.com/api), já que os dois projetos
 * ficam em domínios diferentes.
 */
const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

function buildUrl(path, params) {
  // Quando BASE_URL é absoluta, o segundo argumento é ignorado pelo construtor.
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

async function request(path, { method = 'GET', body, params, raw = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Falha de rede: API fora do ar, sem internet ou bloqueio de CORS.
    throw new ApiError('Não foi possível falar com o servidor. Verifique sua conexão.', 0);
  }

  if (response.status === 401) {
    clearToken();
    // Deixa o AuthContext reagir e mandar o usuário de volta para o login.
    window.dispatchEvent(new CustomEvent('caixacerto:unauthorized'));
  }

  if (raw) {
    if (!response.ok) throw new ApiError('Falha ao exportar os dados', response.status);
    return response;
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(payload.error || 'Erro inesperado', response.status, payload.details);
  }
  return payload;
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path, params) => request(path, { method: 'DELETE', params }),
  download: (path, params) => request(path, { params, raw: true }),
};
