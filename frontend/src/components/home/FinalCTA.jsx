import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Map, PlusCircle } from 'lucide-react';

const FinalCTA = () => {
    const navigate = useNavigate();
    const lodoGreen = "#6FE844"; // Verde vibrante
    const lodoDark = "#59595B";  // Gris de marca
    const lodoLight = "#f4f4f5"; // Gris clarito

    return (
        <section className="py-32 px-6 transition-colors duration-500" style={{ backgroundColor: lodoLight }}>
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -15, shadow: "0 50px 80px -20px rgba(0,0,0,0.15)" }}
                viewport={{ once: true }}
                className="max-w-6xl mx-auto relative rounded-[3rem] overflow-hidden p-12 md:p-24 text-center transition-all duration-500 shadow-2xl shadow-[#6fea44]/20"
                style={{ backgroundColor: lodoGreen }}
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-20 blur-[100px] -mr-48 -mt-48 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#59595B] opacity-20 blur-[100px] -ml-48 -mb-48 pointer-events-none" />

                <div className="relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight font-montserrat" style={{ color: lodoDark }}>
                        ¿Listo para explorar el <span style={{ color: lodoLight }}>ecosistema?</span>
                    </h2>
                    
                    {/* Párrafo dividido en Gris Oscuro y Gris Claro */}
                    <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 font-semibold leading-relaxed">
                        <span style={{ color: lodoDark }}>Unite a la red más grande de AgriFoodTech y empezá a descubrir </span>
                        <span style={{ color: lodoLight }}>las oportunidades que impulsarán tu crecimiento.</span>
                    </p>

                    <div className="flex flex-col items-center gap-8">
                        {/* Botón con Inversión Forzada: Gris Oscuro -> Gris Claro con letras Verdes */}
                        <motion.button
                            whileHover={{ 
                                scale: 1.05,
                                backgroundColor: lodoLight,
                                color: lodoGreen
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/map')}
                            style={{ 
                                backgroundColor: lodoDark,
                                color: "#ffffff" // Texto blanco inicial
                            }}
                            className="group px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center mx-auto shadow-xl transition-colors duration-300"
                        >
                            <Map className="w-6 h-6 mr-3 transition-colors" />
                            ENTRAR AL MAPA
                            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                        </motion.button>

                        <motion.button
                            onClick={() => navigate('/contacto')}
                            whileHover={{ scale: 1.05, opacity: 1 }}
                            className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] transition-all opacity-90"
                            style={{ color: lodoLight }}
                        >
                            <PlusCircle className="w-5 h-5" />
                            ¿Querés agregar tu empresa? Contactanos
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default React.memo(FinalCTA);