# FlipBook by VIBATO — Design System & Product Brief

## Producto

**FlipBook by VIBATO** — Visor interactivo que convierte PDFs en flipbooks con efecto de pasar páginas.
- Dominio: `flip.vibato.io`
- Marca: "FlipBook" es protagonista, "by VIBATO" es badge secundario pequeño en gris.

---

## ICP (Ideal Customer Profile)

**Diseñadores, arquitectos, estudios creativos, y empresas que producen catálogos.**

Gente que vive del diseño, que juzga un producto por su estética en segundos. No son usuarios técnicos — son visuales. Esperan herramientas que estén a la altura de su trabajo.

Verticales objetivo:
- Estudios de arquitectura (portfolios de proyectos)
- Diseñadores gráficos e industriales (portfolios, lookbooks)
- Editoriales y revistas (publicaciones digitales)
- Fabricantes con catálogos de producto (retail, moda, mobiliario)
- Agencias de branding y comunicación
- Inmobiliarias de lujo (presentaciones de propiedades)

---

## Personalidad de marca

**Editorial. Aspiracional. Sofisticada.**

FlipBook NO es un dashboard SaaS técnico. Es una herramienta para creativos. Cada decisión de diseño debe transmitir:
- Cultura visual y sensibilidad estética
- Confianza profesional sin ser fría
- Inspiración — el usuario debe sentir que el producto entiende su mundo
- Elegancia que complementa el contenido que crean sus usuarios

**Tono de comunicación:** Menos "herramienta", más "extensión de tu trabajo creativo". No hables de "optimizar flujos" — habla de "dar vida a tus catálogos".

---

## Tipografía

### ⚠️ IMPORTANTE: FlipBook se diferencia del resto del ecosistema VIBATO

El ecosistema VIBATO (AIVO, Dossier, vibato.io) usa **Sora + Inter** — perfecto para software y B2B técnico. Pero FlipBook habla a diseñadores y arquitectos, y necesita tipografía con alma editorial.

### Fuentes

| Uso | Fuente | Peso | Por qué |
|-----|--------|------|---------|
| **Display / Headlines** | **Instrument Serif** | Regular, Bold | Elegante, editorial, muy usada en portfolios de arquitectura. Serif con personalidad moderna. |
| **Body / UI** | **Satoshi** | Regular (400), Medium (500), Bold (700) | Sans-serif con personalidad. Popular entre diseñadores. No es genérica como Inter ni técnica como Sora. |
| **Monospace** (si necesario) | **JetBrains Mono** | Regular | Solo para datos técnicos, embed codes, etc. Uso mínimo. |

### Carga de fuentes

```css
/* Instrument Serif — Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');

/* Satoshi — Fontshare (gratuita para uso comercial) */
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap');
```

### Escala tipográfica

| Token | Tamaño | Line Height | Fuente | Uso |
|-------|--------|-------------|--------|-----|
| `display` | 72px | 80px | Instrument Serif | Hero headlines |
| `h1` | 56px | 64px | Instrument Serif | Page titles |
| `h2` | 40px | 48px | Instrument Serif | Section titles |
| `h3` | 28px | 36px | Satoshi Medium | Subsection titles |
| `h4` | 22px | 30px | Satoshi Medium | Card titles |
| `body-lg` | 18px | 28px | Satoshi Regular | Lead paragraphs |
| `body` | 16px | 26px | Satoshi Regular | Body text |
| `small` | 14px | 22px | Satoshi Regular | Secondary text |
| `caption` | 12px | 18px | Satoshi Regular | Labels, metadata |

### Reglas tipográficas

- Headlines en **Instrument Serif** siempre. Jamás en sans-serif.
- Body SIEMPRE en Satoshi. No mezclar Inter, no usar system fonts.
- El contraste serif (headlines) + sans (body) es intencional — es el lenguaje de las revistas de arquitectura y diseño.
- Instrument Serif en itálica para citas, destacados editoriales, o acentos de personalidad.
- Letter-spacing en headlines: `-0.02em` para que respire sin separarse.
- Letter-spacing en body small/caption: `0.01em` para legibilidad.

---

## Color

### Color principal

| Token | Hex | Uso |
|-------|-----|-----|
| `--brand` | `#166534` | Verde bosque. Color principal de FlipBook. |
| `--brand-light` | `#16a34a` | Hover states, acentos |
| `--brand-dark` | `#14532d` | Text sobre fondos claros, active states |
| `--brand-50` | `#f0fdf4` | Backgrounds sutiles |
| `--brand-100` | `#dcfce7` | Badges, tags |

### Por qué verde bosque

Sofisticado, diferente, editorial premium. Todos los colores del ecosistema VIBATO son tonos oscuros y profundos — el verde bosque encaja pero se distingue claramente de Dossier (azul) y AIVO (negro).

### Neutrals

```css
--white: #FFFFFF;
--off-white: #FAFAF9;        /* Ligeramente más cálido que el #F8FAFC del ecosistema */
--gray-100: #F5F5F4;
--gray-200: #E7E5E4;
--gray-300: #D6D3D1;
--gray-400: #A8A29E;
--gray-500: #78716C;
--gray-600: #57534E;
--gray-700: #44403C;
--gray-800: #292524;
--gray-900: #1C1917;
```

> **Nota:** Los neutrals de FlipBook usan la escala stone (cálida) en vez de la slate (fría) del ecosistema VIBATO. Esto es intencional — un tono más cálido es más acogedor para creativos y conecta con la sensación editorial/papel.

### Funcionales

```css
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #166534;     /* Usa el brand color en vez del azul genérico */
```

---

## Espaciado y layout

### Principio fundamental: RITMO PAUSADO

FlipBook necesita más aire que un dashboard SaaS típico. Los diseñadores y arquitectos están acostumbrados a trabajar con espacio. Un diseño apretado les parecerá amateur.

### Espaciado de secciones

| Contexto | Padding vertical | Mobile |
|----------|-----------------|--------|
| Landing sections | **160px** | 96px |
| Dashboard sections | 80px | 48px |
| Between elements | 48px standard | 32px |
| Cards internal | 32px | 24px |

> Comparado con el ecosistema VIBATO (120px sections), FlipBook tiene **160px** en la landing. Más espacio = más premium para este público.

### Grid

```css
--container-max: 1200px;     /* Ligeramente más estrecho que los 1280px del ecosistema */
--grid-gap: 40px;            /* Más generoso que los 32px estándar */
--grid-gap-large: 80px;      /* Entre secciones */
```

### Breakpoints

```css
--mobile: 640px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1200px;
```

---

## Componentes

### Border radius

```css
--radius-sm: 6px;         /* Inputs, small elements */
--radius-md: 10px;        /* Cards, panels */
--radius-lg: 16px;        /* Modals, featured cards */
--radius-xl: 24px;        /* CTAs especiales, hero elements */
--radius-full: 9999px;    /* Pills, avatars */
```

> Ligeramente más redondeados que el ecosistema VIBATO (8/12/24). Más suave = más editorial.

### Sombras

```css
--shadow-subtle: 0 1px 3px 0 rgba(28, 25, 23, 0.06);
--shadow-card: 0 4px 12px -2px rgba(28, 25, 23, 0.08);
--shadow-elevated: 0 12px 24px -4px rgba(28, 25, 23, 0.12);
--shadow-dramatic: 0 24px 48px -12px rgba(28, 25, 23, 0.16);
```

> Sombras basadas en el stone-900 (#1C1917), no en el midnight blue del ecosistema. Más cálidas.

### Botones

```css
/* Primary */
background: var(--brand);
color: white;
font-family: 'Satoshi', sans-serif;
font-weight: 500;
padding: 14px 28px;
border-radius: var(--radius-full);    /* Pill shape para CTAs principales */
transition: all 200ms ease;

/* Primary hover */
background: var(--brand-dark);
transform: translateY(-1px);
box-shadow: var(--shadow-card);

/* Secondary */
background: transparent;
color: var(--gray-800);
border: 1.5px solid var(--gray-300);
border-radius: var(--radius-full);

/* Ghost / Text button */
background: transparent;
color: var(--brand);
padding: 8px 16px;
```

### Cards

```css
background: var(--white);
border: 1px solid var(--gray-200);
border-radius: var(--radius-md);
padding: 32px;
transition: all 250ms ease;

/* Hover — sutil elevación */
box-shadow: var(--shadow-card);
border-color: var(--gray-300);
transform: translateY(-2px);
```

### Inputs

```css
background: var(--white);
border: 1.5px solid var(--gray-300);
border-radius: var(--radius-sm);
padding: 12px 16px;
font-family: 'Satoshi', sans-serif;
font-size: 16px;
transition: border-color 150ms ease;

/* Focus */
border-color: var(--brand);
box-shadow: 0 0 0 3px var(--brand-50);
outline: none;
```

---

## Animaciones y transiciones

### Principios

- **Suaves y orgánicas** — nada brusco ni robótico
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` para la mayoría
- Easing para entradas: `cubic-bezier(0, 0, 0.2, 1)`
- Duración base: **200ms** para micro-interacciones, **400ms** para transiciones de contenido, **600-800ms** para animaciones hero

### Hero: Animación de page-flip

El hero de la landing DEBE incluir una animación del efecto de pasar páginas. Esto es el diferenciador visual del producto. Opciones:

1. **CSS 3D flip** — Página que gira con `transform: rotateY()` mostrando un catálogo real
2. **Lottie animation** — Pre-renderizada, más control sobre la calidad
3. **Canvas/WebGL** — Efecto de página curva realista (tipo turn.js)

La animación debe mostrar un catálogo/portfolio de alta calidad pasando páginas, NO un PDF genérico.

### Scroll animations (Framer Motion)

```javascript
// Fade up — para secciones de contenido
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0, 0, 0.2, 1] },
  viewport: { once: true, margin: "-100px" }
};

// Fade in stagger — para grids de cards
const staggerContainer = {
  whileInView: { transition: { staggerChildren: 0.12 } }
};

// Scale subtle — para imágenes/mockups
const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  whileInView: { opacity: 1, scale: 1 },
  transition: { duration: 0.7, ease: [0, 0, 0.2, 1] }
};
```

### Hover states

- Botones: `translateY(-1px)` + shadow
- Cards: `translateY(-2px)` + shadow + border change
- Links: underline con `background-size` animation
- Imágenes: sutil `scale(1.02)` en 300ms

---

## Imagery y contenido visual

### Principio: ASPIRACIONAL

Las imágenes en FlipBook no son screenshots de interfaz. Son mockups de catálogos reales, portfolios de arquitectura, lookbooks de moda, presentaciones de diseño.

### Tipos de imagery

| Tipo | Uso | Estilo |
|------|-----|--------|
| **Mockups de producto** | Hero, features | Catálogos/libros abiertos con diseño bonito, shot en perspectiva con sombras suaves |
| **Screenshots contextuales** | How it works, dashboard preview | Enmarcados en browser/device mockup, nunca crudos |
| **Texturas editoriales** | Backgrounds, decoración | Papel texturizado, gradientes suaves, patterns geométricos sutiles |
| **Fotos de contexto** | About, testimonios | Estudios de diseño, mesas de trabajo, personas creativas (NO stock genérico) |

### Tratamiento de imágenes

- **Sin saturación excesiva** — tonos naturales, ligeramente desaturados
- **Sombras suaves en mockups** — `box-shadow` o sombra renderizada, nunca drop-shadow duro
- **Bordes redondeados en screenshots** — siempre con `border-radius: 10px` mínimo
- **Background de mockups** — off-white (#FAFAF9) o gradiente sutil verde muy claro

---

## Estructura de la web (flip.vibato.io)

### Landing page

1. **Hero**
   - Headline en Instrument Serif: "Tus documentos, convertidos en experiencias"
   - Subtítulo en Satoshi: propuesta de valor para diseñadores/arquitectos
   - CTA principal: "Prueba gratis" (pill button, verde bosque)
   - CTA secundario: "Ver demo" (ghost button)
   - **Animación de page-flip** mostrando un catálogo/portfolio premium pasando páginas
   - Background: limpio, mucho aire, quizás gradiente sutil

2. **Social proof** (opcional, sutil)
   - "Usado por estudios de diseño en X países" o logos de clientes
   - Nunca badges genéricos tipo "Trusted by 1000+ companies"

3. **Features / Cómo funciona**
   - 3-4 bloques con mockup + texto
   - Layout alternado (imagen izq/der)
   - Cada feature con su micro-animación de scroll
   - Ejemplos: "Sube tu PDF", "Personaliza la experiencia", "Comparte con un link"

4. **Showcase / Gallery**
   - Grid de ejemplos reales de flipbooks creados
   - Categorías: Catálogos, Portfolios, Revistas, Presentaciones
   - Cada uno clickeable para ver demo en vivo
   - Esta sección es CLAVE para diseñadores — quieren ver resultados reales

5. **Pricing**
   - Cards limpias, sin colores estridentes
   - Plan destacado con borde verde bosque sutil
   - Precios claros, sin trucos
   - CTA por plan

6. **Testimonios** (cuando haya)
   - Citas en Instrument Serif itálica
   - Foto + nombre + cargo + empresa
   - Diseño editorial, no cards genéricas

7. **CTA final**
   - Headline potente en Instrument Serif
   - Un solo botón
   - Mucho aire alrededor

8. **Footer**
   - Links: Producto, Recursos, Legal
   - Badge "by VIBATO" + link a vibato.io
   - Redes sociales
   - Newsletter (opcional)

### Dashboard / App

El dashboard sigue los mismos principios estéticos pero con más densidad de información:

- Sidebar con navegación limpia
- Tipografía Satoshi para todo el UI del dashboard
- Instrument Serif solo para títulos de página/sección principales
- Color brand (#166534) solo para acciones primarias y estados activos
- Fondo off-white, cards en blanco con border sutil
- Referencia visual: **Linear.app, Vercel Dashboard** pero con la calidez del sistema de color stone

---

## Stack técnico

```
Framework: Next.js 15 (App Router)
Estilos: Tailwind CSS 4
Animaciones: Framer Motion
Internacionalización: next-intl (ES + EN)
Auth: Supabase Auth
Backend: Supabase (PostgreSQL + Edge Functions)
Pagos: Stripe (one-time + suscripciones)
Package Manager: pnpm
Deploy: Vercel o Railway
```

---

## Lo que NO hacer

- ❌ Usar Sora para headlines (es de software, no de editorial)
- ❌ Neutrals fríos (slate) — usar stone (cálidos)
- ❌ Screenshots crudos sin contexto
- ❌ Layouts apretados con poco aire
- ❌ Iconos coloridos decorativos
- ❌ Gradientes llamativos en secciones
- ❌ Stock photos genéricas de "equipo diverso en oficina"
- ❌ Cards con sombras pesadas
- ❌ Lenguaje técnico ("optimiza tus flujos de trabajo", "incrementa tu productividad")
- ❌ Cualquier cosa que parezca un template de Webflow
- ❌ Colores saturados en el content area

## Lo que SÍ hacer

- ✅ Instrument Serif para headlines — editorial, elegante, con alma
- ✅ Satoshi para body — moderna con personalidad
- ✅ Neutrals cálidos (stone) que evocan papel
- ✅ Espacio generoso entre secciones (160px)
- ✅ Mockups de catálogos y portfolios reales
- ✅ Animación de page-flip como pieza central del hero
- ✅ Bordes redondeados suaves (10px cards)
- ✅ Sombras sutiles y cálidas
- ✅ Lenguaje aspiracional ("da vida a tus catálogos", "tus diseños merecen ser vistos")
- ✅ Pill buttons para CTAs principales
- ✅ Contraste serif/sans que evoca revistas de diseño
- ✅ Color verde bosque usado con intención, no como baño

---

## Relación con el ecosistema VIBATO

FlipBook comparte el **ADN estructural** de VIBATO (calidad premium, principios de diseño no negociables, nivel de craft) pero tiene **identidad visual propia** adaptada a su ICP:

| Aspecto | Ecosistema VIBATO | FlipBook |
|---------|-------------------|----------|
| Headlines | Sora | Instrument Serif |
| Body | Inter | Satoshi |
| Neutrals | Slate (fríos) | Stone (cálidos) |
| Section padding | 120px | 160px |
| Container | 1280px | 1200px |
| Border radius | 8px cards | 10px cards |
| Shadows | rgba midnight blue | rgba stone-900 |
| Tono | Técnico, profesional | Editorial, aspiracional |
| Imagery | Screenshots, diagramas | Mockups de catálogos, portfolios |

**Lo que SÍ se comparte:**
- Nivel de calidad y craft (premium siempre)
- Principio de "cada elemento tiene función"
- Componentes funcionales (success, warning, error)
- Stack técnico (Next.js, Supabase, Tailwind, Framer Motion)
- Badge "by VIBATO" en footer
