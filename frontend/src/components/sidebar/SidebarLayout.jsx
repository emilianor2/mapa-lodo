import React from 'react';
import { cn } from '../../lib/utils';

export default function SidebarLayout({ children, isOpen }) {
    return (
        <div
            className={cn(
                "relative flex h-full transition-all duration-500 ease-in-out z-20 overflow-hidden",
                isOpen ? "w-full md:w-[800px]" : "w-0"
            )}
        >
            <div className="flex flex-col md:flex-row h-full w-full border-r overflow-hidden p-4 md:p-6 gap-6" style={{ backgroundColor: '#f4f4f5', borderColor: '#59595B15' }}>
                {children}
            </div>
        </div>
    );
}
