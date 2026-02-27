import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';

// Importación de Estilos (Deben estar instalados vía npm)
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Importación de plugins nativos
import 'leaflet.markercluster';
import 'leaflet.heat';

// COLORES OFICIALES LODO SEGÚN MANUAL
const LODO_GREEN = "#6FEA44";    // Verde Principal
const LODO_LIGHT_GRAY = "#B1B3B3"; // Gris Claro
const LODO_TEXT_GRAY = "#58595B";  // Gris Oscuro

// Icono verde para startups individuales
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Este componente controla la lógica de los puntos y el calor sin romper React
const MapEngine = ({ organizations, viewMode }) => {
    const map = useMap();
    const layerRef = useRef(null);

    useEffect(() => {
        if (!map || !organizations) return;

        // Limpiar lo que haya en el mapa antes de dibujar
        if (layerRef.current) {
            map.removeLayer(layerRef.current);
        }

        if (viewMode === 'points') {
            // MODO PUNTOS CON CLUSTER (Efecto spiderfy/círculo)
            const mg = L.markerClusterGroup({
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                iconCreateFunction: (cluster) => {
                    return L.divIcon({
                        html: `
                            <div style="
                                background-color: ${LODO_GREEN}; 
                                border: 2px solid ${LODO_LIGHT_GRAY}; 
                                width: 34px; height: 34px; border-radius: 50%; 
                                display: flex; align-items: center; justify-content: center; 
                                color: white; font-weight: 800; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                            ">
                                ${cluster.getChildCount()}
                            </div>`,
                        className: 'lodo-cluster-marker',
                        iconSize: L.point(40, 40)
                    });
                }
            });

            organizations.forEach(org => {
                if (org.lat && org.lng) {
                    const m = L.marker([org.lat, org.lng], { icon: greenIcon });
                    m.bindPopup(`
                        <div style="text-align: center;">
                            <b style="color: ${LODO_TEXT_GRAY}">${org.name}</b><br>
                            <span style="color: ${LODO_GREEN}; font-size: 10px; font-weight: bold; text-transform: uppercase;">${org.sector_primary}</span>
                        </div>
                    `);
                    mg.addLayer(m);
                }
            });
            layerRef.current = mg;
        } else {
            // MODO CALOR EN VERDE LODO
            const heatData = organizations
                .filter(o => o.lat && o.lng)
                .map(o => [o.lat, o.lng, 2.5]); // Intensidad intermedia (entre 1.5 y 5.0)

            layerRef.current = L.heatLayer(heatData, {
                radius: 35,      // Tamaño intermedio
                blur: 20,
                gradient: {
                    0.2: '#6FEA44', // Verde LODO base (más área con este color)
                    0.6: '#4ade23', // Verde un poco más fuerte
                    1.0: '#23a100'  // Verde bastante fuerte, pero no negro/musgo como la 1ra vez
                }
            });
        }

        map.addLayer(layerRef.current);

        return () => {
            if (layerRef.current) map.removeLayer(layerRef.current);
        };
    }, [map, organizations, viewMode]);

    return null;
};

export default function MapView({ organizations }) {
    const [viewMode, setViewMode] = useState('heat');
    const validOrgs = organizations || [];

    return (
        <div className="w-full h-full relative" style={{ minHeight: '600px', height: '100%' }}>

            {/* SWITCH ESTILO MANUAL DE MARCA */}
            <div className="absolute top-5 right-5 z-[1000] flex items-center bg-white/95 p-2 px-4 rounded-full shadow-2xl border border-[#B1B3B3] gap-3">
                <span className={`text-[10px] font-black tracking-tighter ${viewMode === 'points' ? 'text-[#58595B]' : 'text-[#B1B3B3]'}`}>MAPA</span>
                <div
                    onClick={() => setViewMode(viewMode === 'points' ? 'heat' : 'points')}
                    className="w-10 h-5 bg-[#B1B3B3] rounded-full relative cursor-pointer transition-colors"
                    style={{ backgroundColor: viewMode === 'heat' ? LODO_GREEN : '#ccc' }}
                >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${viewMode === 'heat' ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
                <span className={`text-[10px] font-black tracking-tighter ${viewMode === 'heat' ? 'text-[#58595B]' : 'text-[#B1B3B3]'}`}>CALOR</span>
            </div>

            <MapContainer
                center={[-34.60, -58.38]}
                zoom={4}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <MapEngine organizations={validOrgs} viewMode={viewMode} />

                <ZoomControl position="bottomright" />
            </MapContainer>
        </div>
    );
}