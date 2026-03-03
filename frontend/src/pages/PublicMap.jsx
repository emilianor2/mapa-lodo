import React, { useState, useEffect } from 'react';
import MapView from '../components/MapView';
import FiltersPanel from '../components/FiltersPanel';
import ResultsList from '../components/ResultsList';
import OrgDetailModal from '../components/OrgDetailModal';
import { fetchAggregates, fetchOrganizations } from '../services/api';

// Debounce helper
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function PublicMap() {
    // Filters state
    const [filters, setFilters] = useState({
        country: '',
        sectorPrimary: '',
        organizationType: '',
        stage: '',
        outcomeStatus: '',
        q: '',
        onlyMappable: true
    });

    const [bbox, setBbox] = useState(null); // minLat,minLng,maxLat,maxLng

    // Debounced states
    const debouncedFilters = useDebounce(filters, 400);
    const debouncedBbox = useDebounce(bbox, 400);

    // Data state
    const [organizations, setOrganizations] = useState([]);
    const [aggregates, setAggregates] = useState(null);
    const [loading, setLoading] = useState(false);

    // Detail Modal state
    const [selectedOrgId, setSelectedOrgId] = useState(null);
    const [centeredLocation, setCenteredLocation] = useState(null);

    // Initial Data Load (Aggregates)
    useEffect(() => {
        fetchAggregates()
            .then(data => setAggregates(data))
            .catch(err => console.error("Error loading aggregates:", err));
    }, []);

    // Fetch Organizations on filters or bbox change
    useEffect(() => {
        setLoading(true);
        const params = { ...debouncedFilters };

        if (debouncedBbox) {
            params.bbox = debouncedBbox;
        }

        fetchOrganizations(params)
            .then(data => {
                setOrganizations(data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [debouncedFilters, debouncedBbox]);

    const handleMarkerClick = (id) => {
        setSelectedOrgId(id);
    };

    const handleResultClick = (org) => {
        if (org.lat && org.lng) {
            setCenteredLocation({ lat: org.lat, lng: org.lng });
        }
        setSelectedOrgId(org.id);
    };

    return (
        <div className="app-container" style={{ backgroundColor: '#f4f4f5' }}>
            <div className="sidebar shadow-2xl bg-white border-r-0" style={{ borderRadius: '0 2.5rem 2.5rem 0' }}>
                <div className="sidebar-header p-8 border-b-0">
                    <img src="/lodo.png" alt="LODO" style={{ height: 40, width: 'auto' }} />
                    <a href="/admin" className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity mt-2 block" style={{ color: '#59595B' }}>Admin Panel</a>
                </div>
                <div className="sidebar-content">
                    <FiltersPanel
                        filters={filters}
                        setFilters={setFilters}
                        aggregates={aggregates}
                    />

                    <div className="px-8 mb-6 py-4 rounded-2xl bg-[#f4f4f5] flex items-center justify-between" style={{ color: '#59595B' }}>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Resultados</span>
                        <span className="text-sm font-black">{organizations.length} {loading && <span className="animate-pulse">...</span>}</span>
                    </div>

                    <ResultsList
                        organizations={organizations}
                        onSelect={handleResultClick}
                    />
                </div>
            </div>

            <div className="map-container">
                <MapView
                    organizations={organizations}
                    onBboxChange={setBbox}
                    onMarkerClick={handleMarkerClick}
                    centeredLocation={centeredLocation}
                />
            </div>

            {selectedOrgId && (
                <OrgDetailModal
                    orgId={selectedOrgId}
                    onClose={() => setSelectedOrgId(null)}
                />
            )}
        </div>
    );
}
