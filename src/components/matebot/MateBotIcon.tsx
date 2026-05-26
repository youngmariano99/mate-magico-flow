/**
 * MateBotIcon — Avatar SVG 100% vectorial del asistente.
 *
 * Reglas:
 *  - Cero dependencias (sin GIF, sin Lottie, sin 3D).
 *  - Animaciones declaradas en `<style>` dentro del SVG para que el componente
 *    sea drop-in y no contamine el CSS global.
 *  - Las animaciones se conmutan por el atributo `data-estado` ("idle" |
 *    "processing"), permitiendo control reactivo desde el padre.
 */

export type EstadoMateBot = "idle" | "processing";

interface PropsMateBotIcon {
  estado?: EstadoMateBot;
  tamano?: number;
  className?: string;
  titulo?: string;
}

export const MateBotIcon = ({
  estado = "idle",
  tamano = 56,
  className,
  titulo = "MateBot",
}: PropsMateBotIcon) => (
  <svg
    role="img"
    aria-label={titulo}
    data-estado={estado}
    width={tamano}
    height={tamano}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <title>{titulo}</title>
    <style>{`
      @keyframes mb-breathe {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.04); }
      }
      @keyframes mb-blink {
        0%, 92%, 100% { transform: scaleY(1); }
        94%, 98%      { transform: scaleY(0.08); }
      }
      @keyframes mb-rise {
        0%   { transform: translate(0, 0) scale(0.6); opacity: 0; }
        25%  { opacity: 0.9; }
        100% { transform: translate(0, -22px) scale(1.1); opacity: 0; }
      }
      @keyframes mb-wiggle {
        0%, 100% { transform: rotate(-6deg); }
        50%      { transform: rotate(2deg); }
      }
      @keyframes mb-spin-yerba {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }

      .mb-body  { transform-origin: 50% 92%; animation: mb-breathe 3.4s ease-in-out infinite; }
      .mb-eye   { transform-origin: center; transform-box: fill-box; animation: mb-blink 4.6s infinite; }
      .mb-eye.r { animation-delay: 0.05s; }
      .mb-bombilla { transform-origin: 62% 38%; transform-box: fill-box; }
      .mb-steam { opacity: 0; transform-origin: center; transform-box: fill-box; }

      svg[data-estado="processing"] .mb-bombilla { animation: mb-wiggle 0.7s ease-in-out infinite; }
      svg[data-estado="processing"] .mb-yerba    { animation: mb-spin-yerba 6s linear infinite; transform-origin: 50% 32%; transform-box: fill-box; }
      svg[data-estado="processing"] .mb-steam    { animation: mb-rise 1.6s ease-out infinite; }
      svg[data-estado="processing"] .mb-steam.s2 { animation-delay: 0.4s; }
      svg[data-estado="processing"] .mb-steam.s3 { animation-delay: 0.85s; }
      svg[data-estado="processing"] .mb-mouth    { d: path("M42 64 Q50 70 58 64"); }
    `}</style>

    {/* Vapor saliendo de la boca del mate (visible sólo en processing) */}
    <g>
      <circle className="mb-steam s1" cx="46" cy="22" r="2.2" fill="#e8d9b8" />
      <circle className="mb-steam s2" cx="54" cy="20" r="1.8" fill="#e8d9b8" />
      <circle className="mb-steam s3" cx="50" cy="24" r="2.6" fill="#e8d9b8" />
    </g>

    {/* Bombilla (pajita metálica) */}
    <g className="mb-bombilla">
      <rect x="60" y="6" width="5" height="36" rx="2.2" fill="#cdd3da" />
      <rect x="60" y="6" width="5" height="36" rx="2.2" fill="url(#mb-grad-bombilla)" opacity="0.55" />
      <ellipse cx="62.5" cy="42" rx="6" ry="3" fill="#8a929c" />
    </g>

    {/* Cuerpo del mate */}
    <g className="mb-body">
      {/* sombra base */}
      <ellipse cx="50" cy="93" rx="26" ry="3.5" fill="#000" opacity="0.25" />

      {/* gourd */}
      <path
        d="M22 56 Q22 30 50 28 Q78 30 78 56 Q78 90 50 90 Q22 90 22 56 Z"
        fill="url(#mb-grad-body)"
        stroke="#3d2417"
        strokeWidth="2"
      />

      {/* borde superior / boca del mate */}
      <ellipse cx="50" cy="30" rx="22" ry="5" fill="#3d2417" />
      <ellipse cx="50" cy="29" rx="20" ry="3.6" fill="#5a3a26" />

      {/* yerba dentro */}
      <g className="mb-yerba">
        <ellipse cx="50" cy="29.5" rx="18" ry="3" fill="#4a6b2f" />
        <circle cx="44" cy="29" r="1.1" fill="#6b8a3f" />
        <circle cx="54" cy="29.6" r="0.9" fill="#3a5424" />
        <circle cx="49" cy="30.2" r="0.7" fill="#7a9a4a" />
      </g>

      {/* faja decorativa */}
      <path
        d="M24 62 Q50 70 76 62 L76 70 Q50 78 24 70 Z"
        fill="#a4622e"
        opacity="0.85"
      />
      <path d="M28 66 L72 66" stroke="#f0c98a" strokeWidth="0.6" opacity="0.7" />

      {/* ojitos */}
      <g>
        <circle className="mb-eye l" cx="40" cy="54" r="3.2" fill="#1a1208" />
        <circle cx="41" cy="53" r="0.9" fill="#fff" />
        <circle className="mb-eye r" cx="60" cy="54" r="3.2" fill="#1a1208" />
        <circle cx="61" cy="53" r="0.9" fill="#fff" />
      </g>

      {/* boca */}
      <path
        className="mb-mouth"
        d="M44 62 Q50 65 56 62"
        stroke="#1a1208"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* brillo */}
      <ellipse cx="34" cy="46" rx="4" ry="8" fill="#fff" opacity="0.18" />
    </g>

    <defs>
      <linearGradient id="mb-grad-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#8a4a2a" />
        <stop offset="55%"  stopColor="#6b3a1f" />
        <stop offset="100%" stopColor="#3f1f0e" />
      </linearGradient>
      <linearGradient id="mb-grad-bombilla" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#fff" stopOpacity="0.9" />
        <stop offset="50%"  stopColor="#fff" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
      </linearGradient>
    </defs>
  </svg>
);
