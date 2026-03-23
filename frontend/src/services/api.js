const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getAuthToken = () => localStorage.getItem('auth_token');
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN;

function fixMojibakeString(value) {
    if (typeof value !== 'string') return value;

    const suspicious = /[ÃÂâ€™â€œâ€â€¢]/;
    let text = value;

    for (let i = 0; i < 3; i += 1) {
        if (!suspicious.test(text)) break;
        try {
            text = decodeURIComponent(escape(text));
        } catch {
            break;
        }
    }

    return text;
}

function normalizeApiPayload(value) {
    if (Array.isArray(value)) {
        return value.map(normalizeApiPayload);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, innerValue]) => [key, normalizeApiPayload(innerValue)])
        );
    }

    return fixMojibakeString(value);
}

async function fetchWithSignal(url, options = {}) {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (!response.ok) {
        const message = text || `HTTP error! status: ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.body = text;
        throw error;
    }

    if (response.status === 204) return null;
    if (!text) return null;
    if (contentType.includes('application/json')) {
        return normalizeApiPayload(JSON.parse(text));
    }
    return fixMojibakeString(text);
}

/**
 * MEJORA: cleanParams ahora mapea nombres de filtros viejos a los nuevos del backend
 * para evitar el error 400.
 */
function cleanParams(params) {
    const cleaned = {};
    // Mapa de traducción: Front-End Viejo -> Back-End Nuevo
    const translationMap = {
        'sectorPrimary': 'vertical',
        'stage': 'estadioActual'
    };

    Object.keys(params).forEach(key => {
        let value = params[key];

        if (value !== '' && value !== null && value !== undefined) {
            // Si la llave está en el mapa, usamos la nueva, sino la original
            const finalKey = translationMap[key] || key;
            cleaned[finalKey] = value;
        }
    });
    return new URLSearchParams(cleaned).toString();
}

const getAuthHeader = () => {
    const userToken = getAuthToken();
    const token = userToken || ADMIN_TOKEN;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- ENDPOINTS PÚBLICOS ---

export const fetchOrganizations = async (params = {}, signal) => {
    const query = cleanParams(params);
    return fetchWithSignal(`${API_URL}/public/organizations?${query}`, { signal });
};

export const fetchOrganizationById = async (id, signal) => {
    return fetchWithSignal(`${API_URL}/public/organizations/${id}`, { signal });
};

export const fetchAggregates = async (params = {}, signal) => {
    const query = cleanParams(params);
    return fetchWithSignal(`${API_URL}/public/organizations/aggregates?${query}`, { signal });
};

export const fetchTaxonomies = async (signal) => {
    return fetchWithSignal(`${API_URL}/public/taxonomies`, { signal });
};

// --- ENDPOINTS ADMINISTRATIVOS ---

export const adminFetchOrganizations = async (params = {}) => {
    const query = cleanParams(params);
    return fetchWithSignal(`${API_URL}/organizations?${query}`, {
        headers: getAuthHeader()
    });
};

export const adminFetchOrganizationById = async (id) => {
    return fetchWithSignal(`${API_URL}/organizations/${id}`, {
        headers: getAuthHeader()
    });
};

export const adminCreateOrganization = async (data) => {
    const { id, ...payload } = data; // Extraemos el id para no enviarlo en el POST
    return fetchWithSignal(`${API_URL}/organizations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
        },
        body: JSON.stringify(payload)
    });
};

export const adminUpdateOrganization = async (id, data) => {
    return fetchWithSignal(`${API_URL}/organizations/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
        },
        body: JSON.stringify(data)
    });
};

export const adminDeleteOrganization = async (id, force = false) => {
    return fetch(`${API_URL}/organizations/${id}${force ? '?force=true' : ''}`, {
        method: 'DELETE',
        headers: getAuthHeader()
    });
};

export const adminSubmitForReview = async (id) => {
    return fetchWithSignal(`${API_URL}/organizations/${id}/review`, {
        method: 'POST',
        headers: getAuthHeader()
    });
};

export const adminPublishOrganization = async (id) => {
    return fetchWithSignal(`${API_URL}/organizations/${id}/publish`, {
        method: 'POST',
        headers: getAuthHeader()
    });
};

export const adminArchiveOrganization = async (id) => {
    return fetchWithSignal(`${API_URL}/organizations/${id}/archive`, {
        method: 'POST',
        headers: getAuthHeader()
    });
};

export const adminGeocodeOrganization = async (id) => {
    return fetchWithSignal(`${API_URL}/organizations/${id}/geocode`, {
        method: 'POST',
        headers: getAuthHeader()
    });
};

export const adminPatchCoordinates = async (id, coords) => {
    return fetchWithSignal(`${API_URL}/organizations/${id}/coordinates`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
        },
        body: JSON.stringify(coords)
    });
};
