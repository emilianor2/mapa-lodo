import React from 'react';
import { Instagram, Linkedin, Facebook } from 'lucide-react';

// Icono X (Twitter) para fidelidad total
const XIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" />
  </svg>
);

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const Footer = () => {
  const lodoDark = "#59595B";
  const lodoGreen = "#6FE844";

  const navItems = [
    "Aceleradora", "Nosotros", "Networking",
    "Servicios", "Innovación", "Eventos", "Contacto"
  ];

  const currentPath =
    typeof window !== "undefined"
      ? window.location.pathname.replace(/\/+$/, '')
      : "";

  const hrefFor = (item) => {
    if (item === "Contacto") return "/contacto";
    return `/${slugify(item)}`;
  };

  const isActive = (item) => currentPath === hrefFor(item);

  return (
    <footer id="footer" className="w-full lodo-font">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
          .lodo-font { font-family: 'Montserrat', sans-serif; }

          .map-card{
            border-radius: 10px;
            overflow: hidden;
            background: #fff;
            box-shadow: 0 10px 24px rgba(0,0,0,.22);
          }

          .social-icon-wrapper {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: ${lodoGreen};
            color: white;
            transition: all 0.3s ease;
            box-shadow: 0 6px 14px rgba(0,0,0,.18);
          }
          .social-icon-wrapper:hover {
            background-color: white;
            color: ${lodoDark};
            transform: translateY(-3px);
          }

          .footer-nav-item {
            font-size: 12px;
            font-weight: 200;
            text-transform: uppercase;
            letter-spacing: 0.0005em;
            color: white;
            text-decoration: none;
            transition: color 0.25s ease;
            white-space: nowrap;
            line-height: 1;
          }
          .footer-nav-item:hover { color: ${lodoGreen} !important; }
          .footer-nav-item.is-active { color: ${lodoGreen} !important; }

          .footer-address { max-width: 300px; }

          @media (max-width: 1023px){
            .footer-right-center { text-align: center; align-items: center; }
            .footer-address { margin-left: auto; margin-right: auto; max-width: 520px; }
          }

          @media (min-width: 1024px){
            .footer-nav-sep{ flex-wrap: nowrap !important; white-space: nowrap !important; }
          }
        `}
      </style>

      <div className="pt-12 pb-9" style={{ backgroundColor: lodoDark }}>
        <div className="max-w-[1240px] mx-auto px-6">

          <div className="flex flex-col-reverse lg:flex-row gap-10 items-start mb-12">

            {/* IZQUIERDA: Mapa + Menú */}
            <div className="w-full lg:flex-1 flex flex-col gap-10">
              <div className="map-card h-[250px] w-full">
                <iframe
                  src="https://maps.google.com/maps?q=Espacio%20Lodo&t=m&z=15&output=embed&iwloc=near"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  title="Espacio Lodo"
                ></iframe>
              </div>

              {/* Menú con separadores equidistantes */}
              <nav className="w-full max-w-full">
                <ul
                  id="menu-1-10a5179"
                  className="footer-nav-sep flex flex-wrap lg:flex-nowrap items-center justify-center lg:justify-start gap-y-3 gap-x-0"
                  data-smartmenus-id="1770682376618098"
                >
                  {navItems.map((item, idx) => (
                    <React.Fragment key={item}>
                      <li className="flex items-center menu-item menu-item-type-post_type menu-item-object-page">
                        <a
                          href={hrefFor(item)}
                          className={`footer-nav-item elementor-item ${isActive(item) ? 'is-active' : ''}`}
                        >
                          {item}
                        </a>
                      </li>
                      {idx !== navItems.length - 1 && (
                        <li className="text-white font-light select-none px-3">|</li>
                      )}
                    </React.Fragment>
                  ))}
                </ul>
              </nav>
            </div>

            {/* DERECHA */}
            <div className="w-full text-white flex flex-col gap-6 lg:flex-none lg:basis-[300px] lg:max-w-[300px] footer-right-center">
              <img
                src="/lodo.png"
                alt="Lodo Logo"
                className="w-[190px] h-auto object-contain"
              />

              <div className="text-[16px] leading-relaxed font-normal footer-address">
                <p>Acceso Sur Lateral Este 5279, Luján de Cuyo, Mendoza, Argentina.</p>
                <p className="mt-4 font-normal">Tel: +54 9 261 659 2746</p>
              </div>

              <div>
                <div className="mb-[10px]">
                  <h4 className="text-[18px] leading-[24px] font-semibold">
                    ¡Seguínos!<br />
                  </h4>
                </div>
                <div className="flex gap-2 justify-center lg:justify-start">
                  <a href="#" className="social-icon-wrapper"><XIcon size={15}/></a>
                  <a href="#" className="social-icon-wrapper"><Instagram size={17} strokeWidth={2.5} /></a>
                  <a href="#" className="social-icon-wrapper"><Linkedin size={17} fill="currentColor" strokeWidth={0} /></a>
                  <a href="#" className="social-icon-wrapper"><Facebook size={17} fill="currentColor" strokeWidth={0} /></a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
