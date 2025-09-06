export default function Logo({ size = 40, className = "" }) {
  return (
    <div 
      className={`inline-flex ${className}`}
      style={{ width: size, height: size }}
      aria-label="Logo EduPlatform"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Quadrado superior esquerdo - Azul */}
        <rect
          x="2"
          y="2"
          width="46"
          height="46"
          rx="8"
          fill="#0052FF"
        />
        
        {/* Quadrado superior direito - Vermelho */}
        <rect
          x="52"
          y="2"
          width="46"
          height="46"
          rx="8"
          fill="#FF0022"
        />
        
        {/* Quadrado inferior esquerdo - Vermelho */}
        <rect
          x="2"
          y="52"
          width="46"
          height="46"
          rx="8"
          fill="#FF0022"
        />
        
        {/* Quadrado inferior direito - Azul */}
        <rect
          x="52"
          y="52"
          width="46"
          height="46"
          rx="8"
          fill="#0052FF"
        />
      </svg>
    </div>
  )
}