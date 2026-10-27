import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BellRing,
  Brain,
  Building2,
  ChartLine,
  Check,
  Ear,
  Handshake,
  HeartPulse,
  MessageCircle,
  SearchCheck,
  Sparkles,
  Wind,
} from "lucide-react";

/*
 * Landing pública.
 *
 * Todo el estilo vive en globals.css (sección "Landing pública"),
 * construido con el mismo sistema de diseño que el resto de la
 * app: sombras sólidas como border-bottom, bordes de 2px, radios
 * 12/16/20 y la escala tipográfica fluida. Aquí no hay estilos en
 * línea ni un CSS module aparte: la página solo compone clases
 * "landing-*" y accesorios de acento (landing-accent-*), así que
 * el modo oscuro y el escalado de fuente salen gratis.
 */

type Accent =
  | "landing-accent-primary"
  | "landing-accent-secondary"
  | "landing-accent-sol"
  | "landing-accent-lavanda"
  | "landing-accent-coral";

type Feature = {
  title: string;
  text: string;
  icon: LucideIcon;
  accent: Accent;
};

const STATS = [
  { value: "24/7", label: "Acompañamiento disponible, sin horarios" },
  { value: "3 pasos", label: "Para empezar a usarla hoy mismo" },
  { value: "0 encuestas", label: "Los datos salen del uso real" },
  { value: "100%", label: "Cada institución ve solo a su gente" },
];

const PILLARS: Feature[] = [
  {
    title: "Escucha",
    text: "Conversaciones diarias con IA, check-ins de ánimo y carga de trabajo — sin fricción.",
    icon: Ear,
    accent: "landing-accent-secondary",
  },
  {
    title: "Detecta",
    text: "Un modelo entrenado con los datos reales de cada persona, no con promedios genéricos.",
    icon: SearchCheck,
    accent: "landing-accent-sol",
  },
  {
    title: "Actúa",
    text: "Pausas activas al instante para la persona y alertas tempranas para quien debe saberlo.",
    icon: Handshake,
    accent: "landing-accent-lavanda",
  },
];

const FEATURES: Feature[] = [
  {
    title: "Chat con IA, 24/7",
    text: "Jorima escucha y responde en cualquier momento, con contención real y sin juicios.",
    icon: MessageCircle,
    accent: "landing-accent-secondary",
  },
  {
    title: "Pausas activas",
    text: "Respiración guiada, estiramientos y actividades cortas para soltar tensión en el momento.",
    icon: Wind,
    accent: "landing-accent-sol",
  },
  {
    title: "Métricas en tiempo real",
    text: "Un nivel de estrés que se actualiza solo, con cada conversación y check-in diario.",
    icon: ChartLine,
    accent: "landing-accent-lavanda",
  },
  {
    title: "Alertas tempranas",
    text: "Si detecta una señal de riesgo, avisa a quien corresponde antes de que escale.",
    icon: BellRing,
    accent: "landing-accent-coral",
  },
  {
    title: "Panel institucional",
    text: "Cada institución ve solo a su gente, con sus propios administradores y datos.",
    icon: Building2,
    accent: "landing-accent-primary",
  },
  {
    title: "Proyección con IA",
    text: "Un modelo entrenado con los datos reales de tu equipo, no encuestas trimestrales.",
    icon: Brain,
    accent: "landing-accent-secondary",
  },
];

const PERSONAL: Feature[] = [
  {
    title: "Alguien que escucha",
    text: "Platica de tu día, tus tareas o cómo te sientes, cuando quieras.",
    icon: HeartPulse,
    accent: "landing-accent-secondary",
  },
  {
    title: "Pausas cuando las necesitas",
    text: "Respiración, estiramientos y actividades cortas para bajar la presión.",
    icon: Wind,
    accent: "landing-accent-sol",
  },
  {
    title: "Tu progreso, visible",
    text: "Ve tu propio nivel de estrés y qué lo está moviendo, con total transparencia.",
    icon: ChartLine,
    accent: "landing-accent-lavanda",
  },
];

const STEPS: { number: string; title: string; text: string; accent: Accent }[] = [
  {
    number: "01",
    title: "Crea tu cuenta",
    text: "Personal en segundos, o institucional cuando tu admin te dé de alta.",
    accent: "landing-accent-secondary",
  },
  {
    number: "02",
    title: "Cuéntale a Jorima cómo vas",
    text: "Un check-in diario de ánimo y carga, más conversación libre cuando lo necesites.",
    accent: "landing-accent-sol",
  },
  {
    number: "03",
    title: "Recibe apoyo real",
    text: "Pausas activas al momento, y seguimiento de tu nivel de estrés en el tiempo.",
    accent: "landing-accent-lavanda",
  },
];

const ENTERPRISE_POINTS = [
  "Detección temprana de burnout, ansiedad e intención de renuncia",
  "Alertas automáticas a RH cuando una conversación lo amerita",
  "Dashboard con nivel de estrés por persona y proyección a futuro",
  "Cada admin ve solo a su propia institución — nunca a otra",
];

const ENTERPRISE_CARDS = [
  {
    title: "Sin encuestas",
    text: "Los datos salen del uso diario real de la app, no de un formulario anual.",
  },
  {
    title: "Multi-institución",
    text: "Da de alta cuantas instituciones necesites, cada una con su propio equipo admin.",
  },
];

const FOOTER_PRODUCT = [
  { label: "Qué es Jorima", href: "#producto" },
  { label: "Para empresas", href: "#empresas" },
  { label: "Para ti", href: "#personal" },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ── NAV ── */}
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <Link href="/" className="landing-brand" aria-label="Jorima, inicio">
            <img src="/jorima/sereno1.png" alt="" width={38} height={38} />
            <span className="landing-brand-name">Jorima</span>
          </Link>

          <nav className="landing-nav-links" aria-label="Secciones del sitio">
            <a href="#producto">Producto</a>
            <a href="#empresas">Para empresas</a>
            <a href="#personal">Para ti</a>
            <a href="#contacto">Contacto</a>
          </nav>

          <div className="landing-nav-ctas">
            <Link
              href="/login"
              className="landing-btn landing-btn-outline landing-btn-sm"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="landing-btn landing-btn-primary landing-btn-sm"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── HERO ── */}
        <section className="landing-hero">
          <div className="landing-container">
            <div className="landing-hero-grid">
              <div className="landing-hero-copy">
                <p className="landing-eyebrow">
                  <Sparkles size={14} aria-hidden />
                  Bienestar emocional con IA
                </p>

                <h1 className="landing-hero-title">
                  Un espacio para hablar, <span className="landing-mark">antes</span> de
                  que el estrés se vuelva crisis.
                </h1>

                <p className="landing-hero-sub">
                  Jorima escucha a tu equipo todos los días, detecta señales de
                  agotamiento a tiempo y le da a cada institución un panel real para
                  actuar — no una encuesta que nadie vuelve a leer.
                </p>

                <div className="landing-hero-actions">
                  <Link
                    href="/registro"
                    className="landing-btn landing-btn-primary landing-btn-lg"
                  >
                    Crear cuenta gratis
                    <ArrowRight size={19} aria-hidden />
                  </Link>
                  <a
                    href="#empresas"
                    className="landing-btn landing-btn-outline landing-btn-lg"
                  >
                    Ver para empresas
                  </a>
                </div>

                <p className="landing-hero-note">
                  <span>
                    <Check size={16} aria-hidden />
                    Gratis para uso personal
                  </span>
                  <span>
                    <Check size={16} aria-hidden />
                    Sin tarjeta de crédito
                  </span>
                  <span>
                    <Check size={16} aria-hidden />
                    Cancela cuando quieras
                  </span>
                </p>
              </div>

              <div className="landing-hero-visual">
                <div className="landing-mascot-card">
                  <div className="landing-mascot-frame">
                    <span className="landing-mascot-badge">En línea</span>
                    <img
                      src="/jorima/sonrisa_amplia.png"
                      alt="Jorima, el asistente de bienestar"
                      width={489}
                      height={510}
                    />
                  </div>

                  <div className="landing-mascot-chat">
                    <div className="landing-bubble">
                      <span className="landing-bubble-label">Jorima</span>
                      ¿Cómo te sientes hoy antes de empezar?
                      <span className="landing-typing" aria-hidden>
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                    <div className="landing-bubble landing-bubble-me">
                      Un poco agobiado, la verdad
                    </div>
                  </div>
                </div>

                {/* Adorno: se oculta en pantallas chicas */}
                <div className="landing-float-card" aria-hidden>
                  <span className="landing-float-label">Nivel de estrés</span>
                  <span className="landing-float-value">32%</span>
                  <span className="landing-meter">
                    <span className="landing-meter-fill" />
                  </span>
                  <span className="landing-float-hint">Bajó 8 puntos esta semana</span>
                </div>
              </div>
            </div>

            <div className="landing-stats">
              {STATS.map((stat) => (
                <div key={stat.value} className="landing-stat">
                  <span className="landing-stat-value">{stat.value}</span>
                  <span className="landing-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── QUÉ ES JORIMA ── */}
        <section id="producto" className="landing-section">
          <div className="landing-container">
            <div className="landing-section-head">
              <span className="landing-kicker">Qué es Jorima</span>
              <h2>
                Bienestar emocional que se mide con datos reales, no con encuestas de
                fin de mes.
              </h2>
              <p>
                Jorima conversa contigo todos los días —por chat, web o app— y
                convierte esas conversaciones, tu ánimo y tu carga de trabajo en un
                número que cualquiera entiende: tu nivel de estrés, actualizado en
                tiempo real.
              </p>
            </div>

            <div className="landing-grid-3">
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <article
                    key={pillar.title}
                    className={`landing-card landing-card-hover ${pillar.accent}`}
                  >
                    <span className="landing-icon-tile">
                      <Icon aria-hidden />
                    </span>
                    <h3 className="landing-card-title">{pillar.title}</h3>
                    <p className="landing-card-text">{pillar.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── PARA EMPRESAS ── */}
        <section id="empresas" className="landing-section">
          <div className="landing-container">
            <div className="landing-enterprise-panel">
              <div className="landing-enterprise-head">
                <span className="landing-tag landing-tag-sol">
                  Jorima for Enterprises &amp; Education
                </span>
                <h2>
                  El bienestar de tu equipo, visible antes de que se convierta en
                  rotación.
                </h2>
                <p>
                  Cada institución tiene su propio espacio: sus administradores, sus
                  colaboradores y un panel que nadie más puede ver. Nada de hojas de
                  cálculo ni encuestas trimestrales que nadie contesta a tiempo.
                </p>
                <a href="#contacto" className="landing-btn landing-btn-primary">
                  Habla con nosotros
                  <ArrowRight size={18} aria-hidden />
                </a>
              </div>

              <div className="landing-enterprise-copy">
                <ul className="landing-checklist">
                  {ENTERPRISE_POINTS.map((point) => (
                    <li key={point}>
                      <span className="landing-check">
                        <Check aria-hidden />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="landing-enterprise-cards">
                  {ENTERPRISE_CARDS.map((card) => (
                    <article key={card.title} className="landing-enterprise-card">
                      <h3>{card.title}</h3>
                      <p>{card.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PARA TI ── */}
        <section id="personal" className="landing-section">
          <div className="landing-container">
            <div className="landing-personal-grid">
              <div className="landing-personal-copy">
                <span className="landing-kicker">Uso personal</span>
                <h2>
                  ¿No perteneces a ninguna institución? Jorima también es para ti.
                </h2>
                <p>
                  Crea tu cuenta, sin institución ni aprobación de nadie, y empieza a
                  platicar con Jorima cuando lo necesites. Tu actividad es solo tuya:
                  nadie más la ve.
                </p>
                <Link href="/registro" className="landing-btn landing-btn-primary">
                  Crear cuenta gratis
                  <ArrowRight size={18} aria-hidden />
                </Link>
              </div>

              <div className="landing-personal-cards">
                {PERSONAL.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={item.title}
                      className={`landing-mini-card ${item.accent}`}
                    >
                      <span className="landing-icon-tile landing-icon-tile-sm">
                        <Icon aria-hidden />
                      </span>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.text}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section className="landing-section">
          <div className="landing-container">
            <div className="landing-section-head">
              <span className="landing-kicker">Cómo funciona</span>
              <h2>Tres pasos, ningún proceso de aprobación complicado.</h2>
            </div>

            <ol className="landing-steps-grid">
              {STEPS.map((step) => (
                <li
                  key={step.number}
                  className={`landing-card landing-card-hover ${step.accent}`}
                >
                  <span className="landing-step-number">{step.number}</span>
                  <h3 className="landing-card-title">{step.title}</h3>
                  <p className="landing-card-text">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── CARACTERÍSTICAS ── */}
        <section className="landing-section">
          <div className="landing-container">
            <div className="landing-section-head">
              <span className="landing-kicker">Características</span>
              <h2>Todo lo que necesitas, en un solo lugar</h2>
              <p>
                Para la persona que lo usa y para quien tiene que cuidar a todo un
                equipo.
              </p>
            </div>

            <div className="landing-grid-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className={`landing-card landing-card-hover ${feature.accent}`}
                  >
                    <span className="landing-icon-tile">
                      <Icon aria-hidden />
                    </span>
                    <h3 className="landing-card-title">{feature.title}</h3>
                    <p className="landing-card-text">{feature.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CIERRE ── */}
        <section className="landing-section">
          <div className="landing-container">
            <div className="landing-cta">
              <h2>¿Listo para cuidar el bienestar de tu equipo?</h2>
              <p>
                Empieza gratis como persona, o escríbenos si representas a una
                institución.
              </p>
              <div className="landing-cta-actions">
                <Link
                  href="/registro"
                  className="landing-btn landing-btn-white landing-btn-lg"
                >
                  Crear cuenta gratis
                  <ArrowRight size={19} aria-hidden />
                </Link>
                <a
                  href="#contacto"
                  className="landing-btn landing-btn-on-dark landing-btn-lg"
                >
                  Hablar con nosotros
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── PIE ── */}
      <footer id="contacto" className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div>
              <div className="landing-footer-brand">
                <img src="/jorima/sereno1.png" alt="" width={34} height={34} />
                <span>Jorima</span>
              </div>
              <p className="landing-footer-about">
                Bienestar emocional con IA, para instituciones y para cualquier
                persona que necesite un espacio donde hablar.
              </p>
            </div>

            <nav className="landing-footer-col" aria-label="Producto">
              <p className="landing-footer-title">Producto</p>
              {FOOTER_PRODUCT.map((link) => (
                <a key={link.label} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>

            <nav className="landing-footer-col" aria-label="Cuenta">
              <p className="landing-footer-title">Cuenta</p>
              <Link href="/login">Iniciar sesión</Link>
              <Link href="/registro">Crear cuenta</Link>
            </nav>

            <div className="landing-footer-col">
              <p className="landing-footer-title">Contacto</p>
              <a href="mailto:hola@jorima.app">hola@jorima.app</a>
              <a href="#empresas">Solicitar información institucional</a>
            </div>
          </div>

          <p className="landing-footer-disclaimer">
            Jorima es una herramienta de apoyo emocional y no sustituye la atención
            psicológica, médica o de emergencia profesional. Si tú o alguien más está
            en peligro inmediato, contacta a servicios de emergencia o a una línea de
            crisis.
          </p>

          <div className="landing-footer-bottom">
            <span>© 2026 Jorima. Todos los derechos reservados.</span>
            <Link href="/aviso-privacidad">Aviso de Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
