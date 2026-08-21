import Link from "next/link";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import styles from "./landing.module.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const FEATURES = [
  {
    title: "Chat con IA, 24/7",
    text: "Jorima escucha y responde en cualquier momento, con contención real y sin juicios.",
    icon: "💬",
  },
  {
    title: "Pausas activas",
    text: "Respiración guiada, estiramientos y actividades cortas para soltar tensión en el momento.",
    icon: "🌿",
  },
  {
    title: "Métricas en tiempo real",
    text: "Un nivel de estrés que se actualiza solo, con cada conversación y check-in diario.",
    icon: "📊",
  },
  {
    title: "Alertas tempranas",
    text: "Si detecta una señal de riesgo, avisa a quien corresponde antes de que escale.",
    icon: "🔔",
  },
  {
    title: "Panel institucional",
    text: "Cada institución ve solo a su gente, con sus propios administradores y datos.",
    icon: "🏢",
  },
  {
    title: "Proyección con IA",
    text: "Un modelo entrenado con los datos reales de tu equipo, no encuestas trimestrales.",
    icon: "🧠",
  },
];

export default function LandingPage() {
  return (
    <div className={`${styles.page} ${fraunces.variable} ${jakarta.variable}`} style={{ fontFamily: "var(--font-body)" }}>
      {/* NAV */}
      <header className={styles.nav}>
        <div className={styles.navBrand}>
          <img src="/jorima/sereno1.png" alt="" />
          Jorima
        </div>

        <nav className={styles.navLinks}>
          <a href="#producto">Producto</a>
          <a href="#empresas">Para empresas</a>
          <a href="#personal">Para ti</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <div className={styles.navCtas}>
          <Link href="/login" className={styles.navGhost}>
            Iniciar sesión
          </Link>
          <Link href="/registro" className={styles.navSolid}>
            Crear cuenta
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className={styles.hero}>
        <div>
          <span className={styles.heroEyebrow}>Bienestar emocional con IA</span>
          <h1 className={styles.heroTitle}>
            Un espacio para hablar, <em>antes</em> de que el estrés se vuelva crisis.
          </h1>
          <p className={styles.heroSubtitle}>
            Jorima escucha a tu equipo todos los días, detecta señales de agotamiento a tiempo,
            y le da a cada institución un panel real para actuar — no una encuesta que nadie
            vuelve a leer.
          </p>

          <div className={styles.heroCtas}>
            <Link href="/registro" className={styles.heroPrimary}>
              Crear cuenta gratis
            </Link>
            <a href="#empresas" className={styles.heroSecondary}>
              Ver para empresas
            </a>
          </div>

          <p className={styles.heroNote}>
            Gratis para uso personal · Sin tarjeta de crédito
          </p>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.mascotWrap}>
            <img src="/jorima/sonrisa_amplia.png" alt="Jorima, el asistente de bienestar" className={styles.mascotImg} />

            <div className={styles.chatBubble}>
              <p className={styles.chatBubbleLabel}>Jorima</p>
              <p className={styles.chatBubbleText}>¿Cómo te sientes hoy antes de empezar?</p>
              <span className={styles.typingDots}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>

            <div className={styles.replyBubble}>Un poco agobiado, la verdad</div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section id="producto" className={styles.intro}>
        <span className={styles.introEyebrow}>Qué es Jorima</span>
        <h2 className={styles.introTitle}>
          Bienestar emocional que se mide con datos reales, no con encuestas de fin de mes.
        </h2>
        <p className={styles.introText}>
          Jorima es un asistente de bienestar que conversa contigo todos los días — por chat,
          web o app — y convierte esas conversaciones, junto con tu ánimo y tu carga de
          trabajo, en un número que cualquiera puede entender: tu nivel de estrés, actualizado
          en tiempo real.
        </p>

        <div className={styles.pillars}>
          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>👂</div>
            <h3>Escucha</h3>
            <p>Conversaciones diarias con IA, check-ins de ánimo y carga de trabajo — sin fricción.</p>
          </div>
          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>🔍</div>
            <h3>Detecta</h3>
            <p>Un modelo entrenado con los datos reales de cada persona, no promedios genéricos.</p>
          </div>
          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>🤝</div>
            <h3>Actúa</h3>
            <p>Pausas activas al instante para la persona, y alertas tempranas para quien debe saberlo.</p>
          </div>
        </div>
      </section>

      {/* PARA EMPRESAS */}
      <section id="empresas" className={styles.enterprise}>
        <div>
          <span className={styles.enterpriseTag}>Jorima for Enterprises & Education</span>
          <h2>El bienestar de tu equipo, visible antes de que se convierta en rotación.</h2>
        </div>

        <div className={styles.enterpriseCopy}>
          <p>
            Cada institución tiene su propio espacio: sus propios administradores, sus propios
            colaboradores, y un panel que nadie más puede ver. Nada de hojas de cálculo ni
            encuestas trimestrales que nadie contesta a tiempo.
          </p>

          <ul className={styles.enterpriseList}>
            <li>
              <span className={styles.enterpriseCheck}>✓</span>
              Detección temprana de burnout, ansiedad e intención de renuncia
            </li>
            <li>
              <span className={styles.enterpriseCheck}>✓</span>
              Alertas automáticas a RH cuando una conversación lo amerita
            </li>
            <li>
              <span className={styles.enterpriseCheck}>✓</span>
              Dashboard con nivel de estrés por persona y proyección a futuro
            </li>
            <li>
              <span className={styles.enterpriseCheck}>✓</span>
              Cada admin ve solo a su propia institución — nunca a otra
            </li>
          </ul>

          <a href="#contacto" className={styles.heroPrimary}>
            Habla con nosotros
          </a>

          <div className={styles.enterpriseGrid} style={{ marginTop: 34 }}>
            <div className={styles.enterpriseStatCard}>
              <h4>Sin encuestas</h4>
              <p>Los datos salen del uso diario real de la app, no de un formulario anual.</p>
            </div>
            <div className={styles.enterpriseStatCard}>
              <h4>Multi-institución</h4>
              <p>Da de alta cuantas instituciones necesites, cada una con su propio equipo admin.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PARA TI (PERSONAL) */}
      <section id="personal" className={styles.personal}>
        <div className={styles.personalCopy}>
          <span className={styles.personalTag}>Uso personal</span>
          <h2>¿No perteneces a ninguna institución? Jorima también es para ti.</h2>
          <p>
            Crea tu cuenta, sin institución ni aprobación de nadie, y empieza a platicar con
            Jorima cuando lo necesites. Tu actividad es solo tuya — nadie más la ve.
          </p>
          <Link href="/registro" className={styles.heroPrimary} style={{ background: "#2a9d8f" }}>
            Crear cuenta gratis
          </Link>
        </div>

        <div className={styles.personalCards}>
          <div className={styles.personalCard}>
            <div className={styles.personalCardIcon}>💬</div>
            <div>
              <strong>Alguien que escucha</strong>
              <span>Platica de tu día, tus tareas o cómo te sientes, cuando quieras.</span>
            </div>
          </div>
          <div className={styles.personalCard}>
            <div className={styles.personalCardIcon}>🧘</div>
            <div>
              <strong>Pausas cuando las necesitas</strong>
              <span>Respiración, estiramientos y actividades cortas para bajar la presión.</span>
            </div>
          </div>
          <div className={styles.personalCard}>
            <div className={styles.personalCardIcon}>📈</div>
            <div>
              <strong>Tu progreso, visible</strong>
              <span>Ve tu propio nivel de estrés y qué lo está moviendo, con total transparencia.</span>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className={styles.steps}>
        <div className={styles.stepsHeader}>
          <h2>Cómo funciona</h2>
          <p>Tres pasos, ningún proceso de aprobación complicado.</p>
        </div>

        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>01</div>
            <h3>Crea tu cuenta</h3>
            <p>Personal en segundos, o institucional cuando tu admin te dé de alta.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>02</div>
            <h3>Cuéntale a Jorima cómo vas</h3>
            <p>Un check-in diario de ánimo y carga, más conversación libre cuando lo necesites.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>03</div>
            <h3>Recibe apoyo real</h3>
            <p>Pausas activas al momento, y seguimiento de tu nivel de estrés en el tiempo.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.features}>
        <div className={styles.featuresHeader}>
          <h2>Todo lo que necesitas, en un solo lugar</h2>
          <p>Para la persona que lo usa, y para quien tiene que cuidar a todo un equipo.</p>
        </div>

        <div className={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <div className={styles.ctaBanner}>
        <h2>¿Listo para cuidar el bienestar de tu equipo?</h2>
        <p>Empieza gratis como persona, o escríbenos si representas a una institución.</p>
        <div className={styles.ctaBannerActions}>
          <Link href="/registro" className={styles.ctaBannerPrimary}>
            Crear cuenta gratis
          </Link>
          <a href="#contacto" className={styles.ctaBannerSecondary}>
            Hablar con nosotros
          </a>
        </div>
      </div>

      {/* FOOTER / CONTACTO */}
      <footer id="contacto" className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <div className={styles.footerBrand}>
              <img src="/jorima/sereno1.png" alt="" />
              Jorima
            </div>
            <p>
              Bienestar emocional con IA, para instituciones y para cualquier persona que
              necesite un espacio donde hablar.
            </p>
          </div>

          <div className={styles.footerCol}>
            <p className={styles.footerColTitle}>Producto</p>
            <a href="#producto">Qué es Jorima</a>
            <a href="#empresas">Para empresas</a>
            <a href="#personal">Para ti</a>
          </div>

          <div className={styles.footerCol}>
            <p className={styles.footerColTitle}>Cuenta</p>
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/registro">Crear cuenta</Link>
          </div>

          <div className={styles.footerCol}>
            <p className={styles.footerColTitle}>Contacto</p>
            <a href="mailto:hola@jorima.app">hola@jorima.app</a>
            <a href="#empresas">Solicitar información institucional</a>
          </div>
        </div>

        <p className={styles.footerDisclaimer}>
          Jorima es una herramienta de apoyo emocional y no sustituye la atención psicológica,
          médica o de emergencia profesional. Si tú o alguien más está en peligro inmediato,
          contacta a servicios de emergencia o a una línea de crisis.
        </p>

        <div className={styles.footerBottom}>
          <span>© 2026 Jorima. Todos los derechos reservados.</span>
          <a href="/aviso-privacidad">Aviso de Privacidad</a>
        </div>
      </footer>
    </div>
  );
}
