import React, { useState } from 'react';
import FloatingControls from './FloatingControls';
import MapDrawer from './MapDrawer';
import { cn } from '../../lib/utils';

export default function MapShellLayout({
    children, // This will be the MapView
    filters,
    onFilterChange,
    aggregates,
    onResetFilters,
    organizations,
    onSelectOrg,
    loading,
    loadingResults,
    loadingFacets,
    searchQuery,
    onSearchChange,
    resultsResetKey,
    isDetailModalOpen = false
}) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("filters");

    const openFilters = () => {
        setActiveTab("filters");
        setIsDrawerOpen(true);
    };

    const openList = () => {
        setActiveTab("results");
        setIsDrawerOpen(true);
    };

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: '#f4f4f5' }}>
            {/* Floating UI Overlay - Hidden when detail modal is open */}
            {!isDetailModalOpen && (
                <FloatingControls
                    onOpenFilters={openFilters}
                    onOpenList={openList}
                    resultsCount={organizations.length}
                    loading={loading}
                />
            )}

            {/* Main Map Content - protagonists */}
            <main className="absolute inset-0 z-0">
                {children}
            </main>

            {/* Sidebar Drawer */}
            <MapDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                filters={filters}
                onFilterChange={onFilterChange}
                aggregates={aggregates}
                onResetFilters={onResetFilters}
                organizations={organizations}
                onSelectOrg={(org) => {
                    onSelectOrg(org);
                    // Optional: close on mobile, stay on desktop
                    // if (window.innerWidth < 768) setIsDrawerOpen(false);
                }}
                loadingResults={loadingResults}
                loadingFacets={loadingFacets}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                resultsResetKey={resultsResetKey}
            />
        </div>
    );
}
