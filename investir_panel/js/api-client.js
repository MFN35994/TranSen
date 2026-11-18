/**
 * TranSen Invest - Shared API Client & Financial Integrity Helpers
 * Enforces 15s timeouts, anti-double-click mutation guards, idempotency keys,
 * short GET caching, and HTML escaping across all Investor Portal pages.
 */
(function () {
    const API_HOST =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8081'
            : 'https://api.transen.org';

    const DEFAULT_TIMEOUT_MS = 15000;
    const GET_CACHE_TTL_MS = 4000;
    const MUTATION_COOLDOWN_MS = 1500;

    const getCache = new Map();
    const inFlightGets = new Map();
    const inFlightMutations = new Set();
    const recentMutations = new Map();

    function escapeHtml(val) {
        if (val === null || val === undefined) return '';
        return String(val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function genIdempotencyKey() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    async function fetchWithSafety(pathOrUrl, options = {}) {
        const method = (options.method || 'GET').toUpperCase();
        const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_HOST}${pathOrUrl}`;
        const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
        const mutationKey = `${method}:${url}`;

        if (isMutation && !options.skipIdempotency) {
            const lastAt = recentMutations.get(mutationKey) || 0;
            if (inFlightMutations.has(mutationKey) || Date.now() - lastAt < MUTATION_COOLDOWN_MS) {
                throw new Error('Opération déjà en cours, veuillez patienter un instant.');
            }
            inFlightMutations.add(mutationKey);
            recentMutations.set(mutationKey, Date.now());
        }

        if (method === 'GET' && !options.bypassCache) {
            const cached = getCache.get(url);
            if (cached && Date.now() - cached.ts < GET_CACHE_TTL_MS) {
                return new Response(cached.bodyText, {
                    status: cached.status,
                    headers: { 'Content-Type': cached.contentType || 'application/json' },
                });
            }
            if (inFlightGets.has(url)) {
                const shared = await inFlightGets.get(url);
                return new Response(shared.bodyText, {
                    status: shared.status,
                    headers: { 'Content-Type': shared.contentType || 'application/json' },
                });
            }
        }

        // Preserve FormData multipart boundary when body is FormData
        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
        const headers = {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(isMutation && !options.skipIdempotency ? { 'X-Idempotency-Key': genIdempotencyKey() } : {}),
            ...(options.headers || {}),
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

        const exec = async () => {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers,
                    signal: options.signal || controller.signal,
                });

                if (isMutation) {
                    getCache.clear();
                }

                if (method === 'GET' && response.ok && !options.bypassCache) {
                    const bodyText = await response.text();
                    const contentType = response.headers.get('content-type') || 'application/json';
                    const payload = { ts: Date.now(), status: response.status, bodyText, contentType };
                    getCache.set(url, payload);
                    return payload;
                }
                return { rawResponse: response };
            } catch (err) {
                if (err && err.name === 'AbortError') {
                    throw new Error("Délai d'attente dépassé (15s). Vérifiez votre connexion internet.");
                }
                throw err;
            } finally {
                clearTimeout(timeoutId);
                if (isMutation && !options.skipIdempotency) {
                    inFlightMutations.delete(mutationKey);
                }
            }
        };

        if (method === 'GET' && !options.bypassCache) {
            const p = exec().finally(() => inFlightGets.delete(url));
            inFlightGets.set(url, p);
            const res = await p;
            if (res.rawResponse) return res.rawResponse;
            return new Response(res.bodyText, {
                status: res.status,
                headers: { 'Content-Type': res.contentType },
            });
        }

        const res = await exec();
        return res.rawResponse;
    }

    window.TransenInvestApi = {
        API_HOST,
        escapeHtml,
        fetchWithSafety,
        genIdempotencyKey,
    };
})();
