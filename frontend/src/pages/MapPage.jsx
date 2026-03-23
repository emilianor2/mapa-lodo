import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import AppShell from '../components/layout/AppShell';
import MapView from '../components/Map/MapView';
import OrgDetailDrawer from '../components/Detail/OrgDetailDrawer';
import MapShellLayout from '../components/Map/MapShellLayout';
import { fetchOrganizations } from '../services/api';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_FILTERS = {
    country: '',
    region: '',
    city: '',
    vertical: '',
    subVertical: '',
    organizationType: '',
    estadioActual: '',
    outcomeStatus: '',
    q: '',
    onlyMappable: false
};

function normalizeText(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function getOrgFieldValue(org, key) {
    switch (key) {
        case 'country':
            return org.location?.country || org.country || '';
        case 'region':
            return org.location?.region || org.region || '';
        case 'city':
            return org.location?.city || org.city || '';
        case 'vertical':
            return org.vertical || '';
        case 'subVertical':
            return org.subVertical || '';
        case 'organizationType':
            return org.organizationType || '';
        case 'estadioActual':
            return org.estadioActual || '';
        case 'outcomeStatus':
            return org.outcomeStatus || '';
        default:
            return '';
    }
}

function matchesExact(value, expected) {
    if (!expected) return true;
    return normalizeText(value) === normalizeText(expected);
}

function matchesSearch(org, query) {
    if (!query) return true;

    const needle = normalizeText(query);
    const haystack = [
        org.name,
        org.website,
        org.solucion,
        org.vertical,
        org.subVertical,
        org.organizationType,
        org.estadioActual,
        org.outcomeStatus,
        org.location?.country,
        org.location?.region,
        org.location?.city
    ]
        .map(normalizeText)
        .filter(Boolean)
        .join(' ');

    return haystack.includes(needle);
}

function filterOrganizations(orgs, filters, excludedKeys = []) {
    return orgs.filter((org) => {
        if (!excludedKeys.includes('q') && !matchesSearch(org, filters.q)) return false;

        const filterKeys = [
            'country',
            'region',
            'city',
            'vertical',
            'subVertical',
            'organizationType',
            'estadioActual',
            'outcomeStatus'
        ];

        for (const key of filterKeys) {
            if (excludedKeys.includes(key)) continue;
            if (!matchesExact(getOrgFieldValue(org, key), filters[key])) return false;
        }

        if (!excludedKeys.includes('onlyMappable') && filters.onlyMappable && (!org.lat || !org.lng)) {
            return false;
        }

        return true;
    });
}

function buildAggregateItems(orgs, key) {
    const counts = new Map();

    orgs.forEach((org) => {
        const value = getOrgFieldValue(org, key);
        if (!value) return;
        counts.set(value, (counts.get(value) || 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.value.localeCompare(b.value, 'es', { sensitivity: 'base' });
        });
}

export default function MapPage() {
    const [searchParams] = useSearchParams();
    const initialVertical = searchParams.get('vertical') || searchParams.get('filter') || '';

    const [filters, setFilters] = useState(() => ({
        ...DEFAULT_FILTERS,
        vertical: initialVertical
    }));
    const [allOrganizations, setAllOrganizations] = useState([]);
    const [loadingResults, setLoadingResults] = useState(true);
    const [selectedOrgId, setSelectedOrgId] = useState(null);
    const [centeredLocation, setCenteredLocation] = useState(null);

    const abortControllerRef = useRef(null);

    useEffect(() => {
        const loadResults = async () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
            const controller = new AbortController();
            abortControllerRef.current = controller;

            setLoadingResults(true);
            try {
                const data = await fetchOrganizations({}, controller.signal);
                if (!controller.signal.aborted) {
                    setAllOrganizations(data || []);
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error(err);
                    toast.error('Error al cargar organizaciones');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingResults(false);
                }
            }
        };

        loadResults();

        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    const filteredOrganizations = useMemo(
        () => filterOrganizations(allOrganizations, filters),
        [allOrganizations, filters]
    );

    const filterResetKey = useMemo(() => JSON.stringify(filters), [filters]);

    const aggregates = useMemo(() => ({
        countries: buildAggregateItems(filterOrganizations(allOrganizations, filters, ['country']), 'country'),
        regions: buildAggregateItems(filterOrganizations(allOrganizations, filters, ['region']), 'region'),
        cities: buildAggregateItems(filterOrganizations(allOrganizations, filters, ['city']), 'city'),
        verticals: buildAggregateItems(filterOrganizations(allOrganizations, filters, ['vertical']), 'vertical'),
        subVerticals: buildAggregateItems(filterOrganizations(allOrganizations, filters, ['subVertical']), 'subVertical'),
        organizationTypes: buildAggregateItems(filterOrganizations(allOrganizations, filters, ['organizationType']), 'organizationType'),
        estadios: buildAggregateItems(filterOrganizations(allOrganizations, filters, ['estadioActual']), 'estadioActual'),
        outcomeStatuses: buildAggregateItems(filterOrganizations(allOrganizations, filters, ['outcomeStatus']), 'outcomeStatus')
    }), [allOrganizations, filters]);

    const handleMarkerClick = useCallback((id) => {
        setSelectedOrgId(id);
    }, []);

    const handleResultClick = useCallback((org) => {
        if (org.lat && org.lng) {
            setCenteredLocation({ lat: org.lat + 0.001, lng: org.lng });
            setTimeout(() => setCenteredLocation({ lat: org.lat, lng: org.lng }), 50);
        }
        setSelectedOrgId(org.id);
    }, []);

    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => {
            if (prev[key] === value) {
                return prev;
            }

            const next = { ...prev, [key]: value };

            if (key === 'country' && prev.country !== value) {
                next.region = '';
                next.city = '';
            }

            if (key === 'region' && prev.region !== value) {
                next.city = '';
            }

            if (key === 'vertical' && prev.vertical !== value) {
                next.subVertical = '';
            }

            return next;
        });
    }, []);

    const handleResetFilters = useCallback(() => {
        setFilters((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(DEFAULT_FILTERS)) {
                return prev;
            }
            return DEFAULT_FILTERS;
        });
    }, []);

    const handleGlobalSearchChange = useCallback((value) => {
        handleFilterChange('q', value);
    }, [handleFilterChange]);

    return (
        <AppShell
            onSearchChange={handleGlobalSearchChange}
            searchValue={filters.q}
            resultsCount={filteredOrganizations.length}
        >
            <MapShellLayout
                filters={filters}
                onFilterChange={handleFilterChange}
                aggregates={aggregates}
                onResetFilters={handleResetFilters}
                organizations={filteredOrganizations}
                onSelectOrg={handleResultClick}
                loading={loadingResults}
                loadingResults={loadingResults}
                loadingFacets={loadingResults}
                searchQuery={filters.q}
                onSearchChange={handleGlobalSearchChange}
                resultsResetKey={filterResetKey}
                isDetailModalOpen={!!selectedOrgId}
                style={{ backgroundColor: '#f4f4f5' }}
            >
                <MapView
                    organizations={filteredOrganizations}
                    onMarkerClick={handleMarkerClick}
                    centeredLocation={centeredLocation}
                    isSidebarOpen={false}
                />
            </MapShellLayout>

            {selectedOrgId && (
                <OrgDetailDrawer
                    orgId={selectedOrgId}
                    onClose={() => setSelectedOrgId(null)}
                />
            )}
        </AppShell>
    );
}
