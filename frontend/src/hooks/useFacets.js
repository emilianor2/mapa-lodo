import { useState, useEffect, useRef, useMemo } from 'react';
import { fetchAggregates } from '../services/api';

/**
 * Hook para gestionar filtros de búsqueda por facetas (conteos dinámicos).
 * Sincronizado con la nueva estructura del backend: verticals y estadios.
 */
export function useFacets(filters) {
    const [facets, setFacets] = useState({
        countries: [],
        regions: [],
        cities: [],
        verticals: [],
        subVerticals: [],
        organizationTypes: [],
        estadios: [],
        outcomeStatuses: []
    });
    const [loading, setLoading] = useState(true);

    const abortControllerRef = useRef(null);

    // Serializamos filtros para evitar bucles infinitos por referencia
    const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

    useEffect(() => {
        const loadFacets = async () => {
            setLoading(true);

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            const aborter = new AbortController();
            abortControllerRef.current = aborter;

            try {
                const currentFilters = JSON.parse(filtersKey);

                // Helper para auto-excluir el filtro activo en el conteo de su propia categoría
                const getParamsExcluding = (key) => {
                    const p = { ...currentFilters };
                    delete p[key];
                    return p;
                };

                const signal = aborter.signal;

                /**
                 * Ejecutamos las llamadas en paralelo.
                 * Nota: Usamos los nombres de parámetros que espera el backend (vertical, estadioActual, etc.)
                 */
                const [resCountry, resRegion, resCity, resVertical, resSubVertical, resType, resEstadio, resStatus] = await Promise.all([
                    fetchAggregates(getParamsExcluding('country'), signal),
                    fetchAggregates(getParamsExcluding('region'), signal),
                    fetchAggregates(getParamsExcluding('city'), signal),
                    fetchAggregates(getParamsExcluding('vertical'), signal),
                    fetchAggregates(getParamsExcluding('subVertical'), signal),
                    fetchAggregates(getParamsExcluding('organizationType'), signal),
                    fetchAggregates(getParamsExcluding('estadioActual'), signal),
                    fetchAggregates(getParamsExcluding('outcomeStatus'), signal)
                ]);

                if (!signal.aborted) {
                    setFacets({
                        countries: resCountry.countries || [],
                        regions: resRegion.regions || [],
                        cities: resCity.cities || [],
                        verticals: resVertical.verticals || [],
                        subVerticals: resSubVertical.subVerticals || [],
                        organizationTypes: resType.organizationTypes || [],
                        estadios: resEstadio.estadios || [],
                        outcomeStatuses: resStatus.outcomeStatuses || []
                    });
                    setLoading(false);
                }

            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("Error al cargar facetas:", err);
                    setLoading(false);
                }
            }
        };

        const timeoutId = setTimeout(loadFacets, 300);

        return () => {
            clearTimeout(timeoutId);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [filtersKey]);

    return { facets, loading };
}
