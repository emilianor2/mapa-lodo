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
const MapEngine = ({ organizations, viewMode, onMarkerClick }) => {
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
                    m.on('click', () => {
                        if (onMarkerClick) {
                            onMarkerClick(org.id);
                        }
                    });
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
                .map(o => [o.lat, o.lng, 1.8]); // Más peso para que el calor se note desde el arranque

            layerRef.current = L.heatLayer(heatData, {
                radius: 46,
                blur: 30,
                minOpacity: 0.32,
                max: 1.3,        // Satura antes para que los hotspots realmente resalten
                gradient: {
                    0.15: '#bfff9c',
                    0.35: '#6FEA44',
                    0.65: '#36c61d',
                    1.0: '#138a00'
                }
            });
        }

        map.addLayer(layerRef.current);

        return () => {
            if (layerRef.current) map.removeLayer(layerRef.current);
        };
    }, [map, organizations, viewMode, onMarkerClick]);

    return null;
};

// Componente asistente para detectar el zoom y avisar al padre
const ZoomHandler = ({ onZoomChange }) => {
    const map = useMap();
    useEffect(() => {
        const handleZoom = () => onZoomChange(map.getZoom());
        map.on('zoomend', handleZoom);
        return () => map.off('zoomend', handleZoom);
    }, [map, onZoomChange]);
    return null;
};

export default function MapView({ organizations, onMarkerClick }) {
    const [viewMode, setViewMode] = useState('points');
    const [currentZoom, setCurrentZoom] = useState(2.5);
    const validOrgs = organizations || [];

    // Estilo 1: Todo Limpio (Zoom inicial)
    const styleClean = "s.t:0|s.e:g.f|p.c:%23ffffff,s.t:6|s.e:g.f|p.c:%23a8d1df,s.e:l|p.v:off,s.t:3|p.v:off";

    // Estilo 2: Con Nombres (Zoom adentro)
    // Nombres en negro (#000000), sin borde (p.v:off en stroke)
    const styleWithLabels = "s.t:0|s.e:g.f|p.c:%23ffffff,s.t:6|s.e:g.f|p.c:%23a8d1df,s.e:l.t.f|p.c:%23000000,s.e:l.t.s|p.v:off,s.t:3|p.v:off";

    return (
        <div className="w-full h-full relative" style={{ minHeight: '600px', height: '100%' }}>

            {/* TEXTURA DE PUNTOS (SOLO EN PAÍSES) */}
            <style dangerouslySetInnerHTML={{__html: `
                .pixel-points-overlay {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    z-index: 401;
                    pointer-events: none;
                    /* Puntos de color calculado para ser más brillantes que el mar 
                       pero más oscuros que la tierra blanca. */
                    background-image: radial-gradient(#e0e0e0 1px, transparent 0);
                    background-size: 5px 5px;
                    /* Darken comparará el color del mapa con el del punto y se quedará con el más oscuro.
                       Como el mar celeste es más oscuro que el punto (#e0e0e0), el mar se queda como está.
                       Como la tierra blanca es más clara que el punto, el punto gana y se dibuja sobre el blanco. */
                    mix-blend-mode: darken;
                }
            `}} />

            <div className="pixel-points-overlay" />

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
                center={[20, 0]}
                zoom={2.5}
                minZoom={2.5}
                zoomSnap={0.5}
                maxBounds={[[-90, -180], [90, 180]]}
                maxBoundsViscosity={1.0}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <ZoomHandler onZoomChange={setCurrentZoom} />

                <TileLayer
                    key={currentZoom > 3 ? 'labels' : 'clean'}
                    url={`https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=es&region=AR&apistyle=${currentZoom > 3 ? styleWithLabels : styleClean}`}
                    noWrap={true}
                    bounds={[[-90, -180], [90, 180]]}
                    attribution="&copy; Google Maps"
                />

                <MapEngine organizations={validOrgs} viewMode={viewMode} onMarkerClick={onMarkerClick} />

                <ZoomControl position="bottomright" />
            </MapContainer>
        </div>
    );
}
