CREATE TABLE IF NOT EXISTS organizations (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255) NULL,
    vertical VARCHAR(64) NOT NULL,       -- Antes sector_primary
    sub_vertical VARCHAR(64) NULL,      -- Antes sector_secondary
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    logo_url VARCHAR(512) NULL,         -- URL de GCS
    estadio_actual VARCHAR(64) NULL,    -- Antes stage
    solucion TEXT NULL,                 -- Antes description
    mail VARCHAR(255) NULL,             -- Antes contact_email
    social_media JSON NULL,             -- Flexibilidad total para RRSS
    contact_phone VARCHAR(50) NULL,
    founders JSON NULL,                 -- Lista flexible de nombres
    founded INT NULL,                   -- Año de constitución
    organization_type VARCHAR(64) NOT NULL,
    outcome_status VARCHAR(64) NOT NULL,
    business_model VARCHAR(64) NULL,
    badges JSON NULL,
    notes TEXT NULL,
    status ENUM('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT',
    lat DECIMAL(10, 7) NULL,
    lng DECIMAL(10, 7) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para velocidad de búsqueda
    INDEX idx_status_vertical (status, vertical),
    INDEX idx_geo (country, region, city)
);