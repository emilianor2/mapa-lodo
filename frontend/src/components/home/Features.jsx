import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Target, Users, Zap, Search, Network, Globe } from 'lucide-react';

const Card = React.memo(({ title, subtitle, icon: Icon, features, isLodo, logoSrc }) => {
    const lodoGreen = "#6FE844";
    const lodoLight = "#f4f4f5"; // Gris claro (casi blanco)
    const lodoDark = "#59595B";  // Fondo de la sección

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -15 }}
            viewport={{ once: true }}
            style={{ 
                backgroundColor: isLodo ? lodoGreen : lodoLight,
                color: lodoDark,
                borderColor: lodoDark 
            }}
            className="group relative p-8 rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden cursor-pointer shadow-xl hover:shadow-[0_25px_50px_rgba(0,0,0,0.2)]"
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLodo ? lodoLight : lodoGreen;
                e.currentTarget.style.borderColor = "transparent"; 
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLodo ? lodoGreen : lodoLight;
                e.currentTarget.style.borderColor = lodoDark;
            }}
        >
            <div className="relative z-10">
                {/* Cuadrado del logo con lógica de contraste */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-black/5 transition-all duration-500 group-hover:scale-110 ${
                    isLodo 
                    ? 'bg-[#f4f4f5] group-hover:bg-white' // En card verde es gris, al invertir es blanco
                    : 'bg-white group-hover:bg-[#f4f4f5]' // En card gris es blanco, al invertir es gris
                }`}>
                    {isLodo && logoSrc ? (
                        <img src={logoSrc} alt="Lodo Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                        <Icon className="w-8 h-8 text-[#59595B]" />
                    )}
                </div>
                
                <h3 className="text-3xl font-bold mb-2 font-montserrat uppercase tracking-tight">
                    {title}
                </h3>
                <p className="mb-8 leading-relaxed font-medium opacity-80">
                    {subtitle}
                </p>

                <div className="grid grid-cols-1 gap-4">
                    {features.map((f, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#59595B] opacity-40 group-hover:opacity-100 transition-opacity" />
                            <span className="text-sm font-bold">
                                {f}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
});

const Features = () => {
    const lodoDark = "#59595B";
    const roadmapSteps = useMemo(() => [
        { label: "Convocatoria", icon: Search },
        { label: "Selección", icon: Target },
        { label: "Mentoría", icon: Users },
        { label: "Inversión", icon: Zap },
        { label: "Escala", icon: Globe }
    ], []);

    return (
        <section id="features" className="py-24 px-6" style={{ backgroundColor: lodoDark }}>
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-32">
                    <Card
                        title="LODO"
                        subtitle="La plataforma centralizada para el descubrimiento y mapeo del ecosistema. Datos en tiempo real para decisiones estratégicas."
                        logoSrc="/lodo2.png"
                        features={[
                            "Mapa interactivo de organizaciones",
                            "Filtros avanzados por sector y tipo",
                            "Directorio de startups y proveedores",
                            "Análisis de clusters por región"
                        ]}
                        isLodo={true}
                    />
                    <Card
                        title="LODAR"
                        subtitle="Nuestro brazo ejecutor y acelerador. Programas diseñados para potenciar el crecimiento de startups de alto impacto."
                        icon={Rocket}
                        features={[
                            "Programas de aceleración a medida",
                            "Red de mentores especializados",
                            "Acceso a capital semilla y venture",
                            "Validación técnica y comercial"
                        ]}
                        isLodo={false}
                    />
                </div>

                <div className="relative">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-montserrat tracking-tight">
                            El camino al <span className="text-[#6FE844]">éxito</span>
                        </h2>
                    </div>

                    <div className="relative max-w-5xl mx-auto">
                        <div className="absolute top-10 left-0 w-full h-[2px] bg-white/10 hidden md:block" />

                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-12">
                            {roadmapSteps.map((step, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    className="relative z-10 flex flex-col items-center group"
                                >
                                    <div 
                                        style={{ backgroundColor: lodoDark }}
                                        className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mb-6 group-hover:border-[#6FE844] transition-all duration-300 shadow-xl group-hover:scale-110"
                                    >
                                        <step.icon className="w-8 h-8 text-white/40 group-hover:text-[#6FE844] transition-colors" />
                                    </div>
                                    <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors uppercase tracking-widest text-center">
                                        {step.label}
                                    </span>
                                    
                                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#6FE844] flex items-center justify-center text-[11px] font-black text-[#59595B] shadow-lg border-2 border-[#59595B]">
                                        {idx + 1}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default React.memo(Features);