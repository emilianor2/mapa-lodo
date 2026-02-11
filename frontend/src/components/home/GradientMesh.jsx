import React from 'react';
import { motion } from 'framer-motion';

const GradientMesh = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-zinc-50 dark:bg-[#050505] transition-colors duration-700">
            {/* Capa de viñeta para dar profundidad */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.05)_100%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0)_0%,rgba(5,5,5,1)_100%)]" />

            {/* Blob Principal - Verde Lodo */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                    opacity: [0.1, 0.2, 0.1],
                    x: [0, 30, 0],
                    y: [0, 20, 0] 
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{ willChange: "transform, opacity" }} // Forzar aceleración por hardware
                className="absolute top-[-5%] left-[-5%] w-[60%] h-[60%] bg-[#6fea44]/20 dark:bg-[#6fea44]/15 rounded-full blur-[100px]"
            />

            {/* Blob Secundario - Gris Corporativo / Azul sutil para contraste */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                    opacity: [0.05, 0.15, 0.05],
                    x: [0, -40, 0],
                    y: [0, 40, 0] 
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{ willChange: "transform, opacity" }}
                className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-[#58595b]/20 dark:bg-emerald-900/10 rounded-full blur-[120px]"
            />

            {/* Tercer punto de luz para equilibrio visual */}
            <motion.div
                animate={{ 
                    opacity: [0.05, 0.1, 0.05],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-[30%] right-[15%] w-[30%] h-[30%] bg-[#6fea44]/10 rounded-full blur-[90px]"
            />

            {/* Noise Texture Overlay - Optimizado */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
};

export default React.memo(GradientMesh);