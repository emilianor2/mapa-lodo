-- Limpieza total usando los nombres exactos para asegurar borrado
DELETE FROM taxonomies WHERE category IN ('vertical', 'subvertical', 'estadioactual', 'organizationtype', 'outcomestatus', 'businessmodel', 'badges');

INSERT INTO taxonomies (category, value, label, sort_order) VALUES
-- 1. VERTICALES
('vertical', 'agtech', 'AgTech', 10),
('vertical', 'biotech_bioinputs', 'Biotecnología y Bioinsumos', 20),
('vertical', 'foodtech', 'FoodTech', 30),
('vertical', 'climatech', 'ClimaTech', 40),
('vertical', 'circular_economy', 'Economía Circular', 50),
('vertical', 'otra', 'OTRA', 60),

-- 2. SUB-VERTICALES (Ahora en minúsculas para coincidir con el Frontend)
('subvertical', 'digital_ag', 'Agricultura Digital / Software Agrícola', 101),
('subvertical', 'ag_hardware', 'Hardware Agrícola y Automatización', 102),
('subvertical', 'water_tech', 'Tecnología de Riego y Agua', 103),
('subvertical', 'ag_fintech', 'FinTech y InsurTech Agrícola', 104),
('subvertical', 'crop_genomics', 'Genómica de Cultivos', 201),
('subvertical', 'biofertilizers', 'Biofertilizantes', 202),
('subvertical', 'biopesticides', 'Biopesticidas', 203),
('subvertical', 'sustainable_inputs', 'Fertilizantes Avanzados / Insumos Sostenibles', 204),
('subvertical', 'genetics_breeding', 'Genética y Fitomejoramiento', 205),
('subvertical', 'bio_protection', 'Protección Biológica de Cultivos', 206),
('subvertical', 'biostimulants', 'Bioestimulantes Vegetales', 207),
('subvertical', 'agronomic_support', 'Soporte Agronómico Digital', 208),
('subvertical', 'bioengineering', 'Bioingeniería y Biomateriales', 209),
('subvertical', 'novel_ingredients', 'Nuevos Ingredientes y Proteínas Alternativas', 301),
('subvertical', 'food_processing', 'Tecnología de Procesamiento de Alimentos', 302),
('subvertical', 'indoor_ag', 'Agricultura de Interior y Ambientes Controlados', 303),
('subvertical', 'food_safety', 'Seguridad Alimentaria, Trazabilidad y Calidad', 304),
('subvertical', 'carbon_solutions', 'Soluciones Climáticas y de Carbono', 401),
('subvertical', 'soil_health', 'Salud del Suelo y Agricultura Regenerativa', 402),
('subvertical', 'env_impact', 'Sostenibilidad e Impacto Ambiental', 403),
('subvertical', 'waste_upcycling', 'Economía Circular y Revalorización de Residuos', 501),
('subvertical', 'otra_especificar', 'Otra (especificar en notas)', 601),

-- 3. ETAPA DE MADUREZ
('estadioactual', 'pre_seed', 'Pre-Seed', 10),
('estadioactual', 'seed', 'Seed', 20),
('estadioactual', 'early_stage', 'Early Stage', 30),
('estadioactual', 'series_a_early_growth', 'Series A / Early Growth', 40),
('estadioactual', 'series_b_growth', 'Series B / Growth', 50),
('estadioactual', 'scale_up', 'Scale-up', 60),
('estadioactual', 'mature_late_stage', 'Mature / Late Stage', 70),
('estadioactual', 'acquired', 'Adquirida (Acquired)', 80),
('estadioactual', 'exit', 'Exit', 90),
('estadioactual', 'unknown', 'Desconocido / Sin datos', 100),

-- 4. MODELO DE NEGOCIO
('businessmodel', 'b2c', 'B2C', 10),
('businessmodel', 'b2b', 'B2B', 20),
('businessmodel', 'b2b_b2b', 'B2B + B2B', 30),
('businessmodel', 'b2g', 'B2G', 40),
('businessmodel', 'b2b_b2g', 'B2B + G', 50),
('businessmodel', 'b2c_b2g', 'B2C + G', 60),
('businessmodel', 'b2b_b2c_b2g', 'B2B + C + G', 70),
('businessmodel', 'otra', 'Otro', 80),

-- 5. DESTACADOS / BADGES
('badges', 'unicorn', 'Unicornio (Valuación > USD 1.000M)', 10),
('badges', 'soonicorn', 'Soonicorn (Cercana a USD 1.000M)', 20),
('badges', 'vc_backed', 'VC-backed (Respaldada por Venture Capital)', 30),
('badges', 'corporate_backed', 'Corporate-backed', 40),
('badges', 'high_growth', 'Alto Crecimiento (High growth)', 50),
('badges', 'climate_positive', 'Climate-positive', 60),
('badges', 'b_corp', 'B Corp', 70),
('badges', 'women_led', 'Liderado por Mujeres', 80),
('badges', 'none', 'Ninguna', 90),

-- 6. TIPO DE ORGANIZACIÓN
('organizationtype', 'startup', 'Startup', 10),
('organizationtype', 'investor', 'Inversor', 20),
('organizationtype', 'accelerator', 'Aceleradora', 30),
('organizationtype', 'university', 'Universidad', 40),
('organizationtype', 'public_entity', 'Organismo Público', 50),
('organizationtype', 'media', 'Medio de Comunicación', 60),
('organizationtype', 'support_entity', 'Entidad de apoyo/difusión/promoción', 70),

-- 7. ESTADO OPERATIVO
('outcomestatus', 'active', 'Activa', 10),
('outcomestatus', 'acquired', 'Adquirida', 20),
('outcomestatus', 'closed', 'Cerrada', 30);