import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, ZoomControl, GeoJSON, Pane } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';

let countriesGeoJsonCache = null;
let countriesGeoJsonPromise = null;

function getCountriesGeoJson() {
    if (countriesGeoJsonCache) {
        return Promise.resolve(countriesGeoJsonCache);
    }

    if (!countriesGeoJsonPromise) {
        countriesGeoJsonPromise = fetch('/countries.geo.json')
            .then((res) => res.json())
            .then((data) => {
                countriesGeoJsonCache = data;
                return data;
            })
            .catch((err) => {
                countriesGeoJsonPromise = null;
                throw err;
            });
    }

    return countriesGeoJsonPromise;
}

const getClusterSizeClass = (count) => {
    if (count < 10) return 'small';
    if (count < 100) return 'medium';
    return 'large';
};

const hexToRgba = (hex, alpha) => {
    const value = hex.replace('#', '');
    const r = parseInt(value.substring(0, 2), 16);
    const g = parseInt(value.substring(2, 4), 16);
    const b = parseInt(value.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getClusterColors = (count) => {
    const palette = ['#334155', '#1f2937', '#111827', '#0f172a', '#020617'];
    let index = 0;

    if (count >= 6 && count <= 10) index = 1;
    if (count >= 11 && count <= 15) index = 2;
    if (count >= 16 && count <= 20) index = 3;
    if (count >= 21) index = 4;

    const fill = palette[index];

    return {
        fill,
        halo: hexToRgba(fill, 0.42)
    };
};

const createClusterIcon = (cluster) => {
    const count = cluster.getChildCount();
    const { fill, halo } = getClusterColors(count);
    const sizeClass = getClusterSizeClass(count);

    return L.divIcon({
        html: `<div style="--cluster-fill:${fill}; --cluster-halo:${halo};"><span>${count}</span></div>`,
        className: `marker-cluster marker-cluster-${sizeClass}`,
        iconSize: L.point(40, 40)
    });
};

// Fix for default marker icon missing in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle bbox changes
function MapEvents({ onBboxChange }) {
    const map = useMapEvents({
        moveend: () => {
            const bounds = map.getBounds();
            const bbox = [
                bounds.getSouthWest().lat,
                bounds.getSouthWest().lng,
                bounds.getNorthEast().lat,
                bounds.getNorthEast().lng,
            ].join(',');
            onBboxChange(bbox);
        },
    });
    return null;
}

function ClusterVisibilityController({ threshold = 5, onChange }) {
    const map = useMapEvents({
        zoomend: () => onChange(map.getZoom() >= threshold),
    });

    useEffect(() => {
        onChange(map.getZoom() >= threshold);
    }, [map, threshold, onChange]);

    return null;
}

function CountryTooltipVisibilityController({ threshold = 5, onChange }) {
    const map = useMapEvents({
        zoomend: () => onChange(map.getZoom() < threshold),
    });

    useEffect(() => {
        onChange(map.getZoom() < threshold);
    }, [map, threshold, onChange]);

    return null;
}

const CHOROPLETH_COLORS = ['#8fcc8c', '#64c163', '#3eb246', '#2a9535', '#1c7226'];
const COUNTRY_TOOLTIP_ZOOM_THRESHOLD = 5;

const COUNTRY_ALIASES = {
    'argentina': 'argentina',
    'bolivia': 'bolivia',
    'brasil': 'brazil',
    'brazil': 'brazil',
    'chile': 'chile',
    'colombia': 'colombia',
    'costa rica': 'costa rica',
    'cuba': 'cuba',
    'ecuador': 'ecuador',
    'el salvador': 'el salvador',
    'espana': 'spain',
    'españa': 'spain',
    'guatemala': 'guatemala',
    'honduras': 'honduras',
    'mexico': 'mexico',
    'méxico': 'mexico',
    'nicaragua': 'nicaragua',
    'panama': 'panama',
    'panamá': 'panama',
    'paraguay': 'paraguay',
    'peru': 'peru',
    'perú': 'peru',
    'puerto rico': 'puerto rico',
    'republica dominicana': 'dominican republic',
    'república dominicana': 'dominican republic',
    'uruguay': 'uruguay',
    'venezuela': 'venezuela',
    'estados unidos': 'united states of america',
    'eeuu': 'united states of america',
    'ee. uu.': 'united states of america',
    'usa': 'united states of america',
    'united states': 'united states of america',
    'reino unido': 'united kingdom',
    'inglaterra': 'united kingdom',
    'alemania': 'germany',
    'francia': 'france',
    'italia': 'italy',
    'paises bajos': 'netherlands',
    'países bajos': 'netherlands',
    'holanda': 'netherlands',
    'suiza': 'switzerland',
    'austria': 'austria',
    'portugal': 'portugal',
    'irlanda': 'ireland',
    'belgica': 'belgium',
    'bélgica': 'belgium',
    'noruega': 'norway',
    'suecia': 'sweden',
    'dinamarca': 'denmark',
    'finlandia': 'finland',
    'polonia': 'poland',
    'rumania': 'romania',
    'rep checa': 'czechia',
    'rep. checa': 'czechia',
    'chequia': 'czechia',
    'grecia': 'greece',
    'turquia': 'turkey',
    'turquía': 'turkey',
    'rusia': 'russia',
    'ucrania': 'ukraine',
    'china': 'china',
    'india': 'india',
    'japon': 'japan',
    'japón': 'japan',
    'corea del sur': 'south korea',
    'corea del norte': 'north korea',
    'israel': 'israel',
    'arabia saudita': 'saudi arabia',
    'arabia saudí': 'saudi arabia',
    'emiratos arabes unidos': 'united arab emirates',
    'emiratos árabes unidos': 'united arab emirates',
    'sudafrica': 'south africa',
    'sudáfrica': 'south africa',
    'nigeria': 'nigeria',
    'egipto': 'egypt',
    'marruecos': 'morocco',
    'kenia': 'kenya',
    'australia': 'australia',
    'nueva zelanda': 'new zealand',
    'canada': 'canada',
    'canadá': 'canada'
};

function normalizeCountryName(value) {
    if (!value) return '';
    return String(value)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
}

// Component to fly to coordinates when updated
function FlyToLocation({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([lat, lng], 16, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [lat, lng, map]);
    return null;
}

// Component to handle map resizing ultra-smoothly using ResizeObserver with throttling
function ResizeMap() {
    const map = useMap();
    const container = map.getContainer();
    const requestRef = useRef();

    useEffect(() => {
        if (!container) return;

        const observer = new ResizeObserver(() => {
            if (requestRef.current) return;
            requestRef.current = requestAnimationFrame(() => {
                map.invalidateSize({ animate: false }); // animate: false is smoother for continuous resizing
                requestRef.current = null;
            });
        });

        observer.observe(container);

        // Initial sync
        map.invalidateSize();

        return () => {
            observer.disconnect();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [map, container]);

    return null;
}

export default function MapView({ organizations, onBboxChange, onMarkerClick, centeredLocation }) {
    // Center of South America approx
    const defaultPosition = [10, -20];
    const defaultZoom = 3;
    const [worldGeo, setWorldGeo] = useState(null);
    const [showClusters, setShowClusters] = useState(defaultZoom >= 5);
    const [showCountryTooltips, setShowCountryTooltips] = useState(defaultZoom < COUNTRY_TOOLTIP_ZOOM_THRESHOLD);
    const [debouncedOrganizations, setDebouncedOrganizations] = useState(organizations);
    const countsByCountryRef = useRef(new Map());

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedOrganizations(organizations);
        }, 180);

        return () => clearTimeout(timer);
    }, [organizations]);

    useEffect(() => {
        let mounted = true;
        getCountriesGeoJson()
            .then((data) => {
                if (mounted) setWorldGeo(data);
            })
            .catch(() => {
                if (mounted) setWorldGeo(null);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const countsByCountry = useMemo(() => {
        const counts = new Map();
        for (const org of debouncedOrganizations) {
            const normalized = normalizeCountryName(org.country);
            if (!normalized) continue;
            const canonical = COUNTRY_ALIASES[normalized] || normalized;
            counts.set(canonical, (counts.get(canonical) || 0) + 1);
        }
        return counts;
    }, [debouncedOrganizations]);

    useEffect(() => {
        countsByCountryRef.current = countsByCountry;
    }, [countsByCountry]);

    const maxCountryCount = useMemo(() => {
        let max = 0;
        for (const count of countsByCountry.values()) {
            if (count > max) max = count;
        }
        return max;
    }, [countsByCountry]);

    const getCountryCount = (feature, countsMap = countsByCountry) => {
        const featureName = feature?.properties?.name;
        const normalized = normalizeCountryName(featureName);
        const canonical = COUNTRY_ALIASES[normalized] || normalized;
        return countsMap.get(canonical) || 0;
    };

    const getCountryFillColor = (count) => {
        if (count <= 0 || maxCountryCount <= 0) return '#e5e7eb';
        if (maxCountryCount === 1) return CHOROPLETH_COLORS[2];
        const index = Math.round(((count - 1) / (maxCountryCount - 1)) * (CHOROPLETH_COLORS.length - 1));
        return CHOROPLETH_COLORS[Math.max(0, Math.min(index, CHOROPLETH_COLORS.length - 1))];
    };

    const countryStyle = (feature) => {
        const count = getCountryCount(feature);
        return {
            color: '#111111',
            weight: 1.6,
            opacity: 0.9,
            fillColor: getCountryFillColor(count),
            fillOpacity: count > 0 ? 0.62 : 0.12
        };
    };

    const onEachCountry = (feature, layer) => {
        if (!showCountryTooltips) return;

        const countryName = feature?.properties?.name || 'Sin nombre';
        const initialCount = getCountryCount(feature, countsByCountryRef.current);
        layer.bindTooltip(`<strong>${countryName}</strong><br/>Startups: ${initialCount}`, {
            sticky: true,
            direction: 'top',
            opacity: 1,
            className: 'country-tooltip',
            offset: [0, -2]
        });
        layer.on('mouseover', () => {
            const latestCount = getCountryCount(feature, countsByCountryRef.current);
            layer.setTooltipContent(`<strong>${countryName}</strong><br/>Startups: ${latestCount}`);
        });
    };

    // Memoize markers to prevent unnecessary re-renders
    const markers = useMemo(() => {
        return organizations.map(org => {
            if (!org.lat || !org.lng) return null;
            return (
                <Marker
                    key={org.id}
                    position={[org.lat, org.lng]}
                    eventHandlers={{
                        click: () => onMarkerClick(org.id),
                    }}
                >
                    <Popup className="custom-popup">
                        <div
                            className="p-1 min-w-[180px] cursor-pointer group/popup"
                            onClick={() => onMarkerClick(org.id)}
                        >
                            <h3 className="font-bold text-sm text-foreground decoration-primary group-hover/popup:underline transition-all">
                                {org.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                {org.city || 'Ciudad desconocida'}, {org.country}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
                                    {org.sectorPrimary}
                                </span>
                            </div>
                            <p className="text-[10px] font-medium text-primary mt-2 flex items-center justify-end uppercase tracking-wider">
                                Detalles →
                            </p>
                        </div>
                    </Popup>
                </Marker>
            );
        });
    }, [organizations, onMarkerClick]);

    return (
        <div className="w-full h-full relative group bg-[#cbd2d3]">
            <MapContainer
                center={defaultPosition}
                zoom={defaultZoom}
                minZoom={2.7}
                maxBounds={[[-85, -179.9], [85, 179.9]]}
                maxBoundsViscosity={1.0}
                worldCopyJump={false}
                scrollWheelZoom={true}
                className="w-full h-full z-0"
                zoomControl={false}
                preferCanvas={true} // Improves performance for many markers
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                    noWrap={true}
                />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
                    minZoom={6}
                    noWrap={true}
                />

                <ZoomControl position="bottomright" />

                <MapEvents onBboxChange={onBboxChange} />
                <ClusterVisibilityController threshold={5} onChange={setShowClusters} />
                <CountryTooltipVisibilityController
                    threshold={COUNTRY_TOOLTIP_ZOOM_THRESHOLD}
                    onChange={setShowCountryTooltips}
                />
                <ResizeMap />

                {centeredLocation && <FlyToLocation lat={centeredLocation.lat} lng={centeredLocation.lng} />}

                {worldGeo && (
                    <Pane name="countries" style={{ zIndex: 350 }}>
                        <GeoJSON
                            key={`countries-tooltips-${showCountryTooltips ? 'on' : 'off'}`}
                            data={worldGeo}
                            style={countryStyle}
                            onEachFeature={onEachCountry}
                            pane="countries"
                        />
                    </Pane>
                )}

                {showClusters && (
                    <MarkerClusterGroup
                        chunkedLoading
                        maxClusterRadius={40}
                        spiderfyOnMaxZoom={true}
                        showCoverageOnHover={false}
                        singleMarkerMode={true}
                        iconCreateFunction={createClusterIcon}
                        polygonOptions={{
                            fillColor: '#111827',
                            color: '#111827',
                            weight: 2,
                            opacity: 0.95,
                            fillOpacity: 0.14
                        }}
                    >
                        {markers}
                    </MarkerClusterGroup>
                )}
            </MapContainer>
        </div>
    );
}
