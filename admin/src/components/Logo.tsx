import React from 'react';

interface LogoProps {
  className?: string; // controla a altura, ex.: "h-9"
}

/** Logo oficial do Escala Swipe, versão para fundo escuro (letras escuras clareadas). Original: /public/logo.png */
export const Logo: React.FC<LogoProps> = ({ className = 'h-9' }) => (
  <picture>
    <source srcSet="/logo-light.webp" type="image/webp" />
    <img src="/logo-light.png" alt="Escala Swipe" className={`${className} w-auto select-none`} draggable={false} />
  </picture>
);
