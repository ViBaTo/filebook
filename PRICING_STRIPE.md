# FlipBook - Configuración de Precios en Stripe

> Documentación completa del sistema de monetización de FlipBook, integrado con Stripe y Supabase.

---

## Tabla de contenidos

1. [Resumen del modelo de negocio](#resumen-del-modelo-de-negocio)
2. [Planes y precios](#planes-y-precios)
3. [Productos a crear en Stripe Dashboard](#productos-a-crear-en-stripe-dashboard)
4. [Lookup Keys](#lookup-keys)
5. [Flujo de pago (Checkout)](#flujo-de-pago-checkout)
6. [Webhooks de Stripe](#webhooks-de-stripe)
7. [Base de datos (Supabase)](#base-de-datos-supabase)
8. [Lógica de negocio y permisos](#lógica-de-negocio-y-permisos)
9. [Portal de facturación](#portal-de-facturación)
10. [Variables de entorno necesarias](#variables-de-entorno-necesarias)
11. [Checklist de configuración en Stripe](#checklist-de-configuración-en-stripe)

---

## Resumen del modelo de negocio

FlipBook utiliza un **modelo híbrido** con dos tipos de monetización:

| Tipo | Descripción |
|------|-------------|
| **Suscripciones mensuales** | Planes recurrentes (Pro y Business) con facturación mensual |
| **Pago único** | Compra de créditos premium para crear flipbooks individuales sin suscripción |

La moneda es **EUR (euros)** para todos los planes.

---

## Planes y precios

### Plan Free (Gratuito)

| Característica | Valor |
|---|---|
| **Precio** | 0€ |
| **Tipo** | Sin pago |
| **Max tamaño PDF** | 50 MB |
| **Max flipbooks** | 3 |
| **Max páginas/flipbook** | 50 |
| **Dominio personalizado** | No |
| **Analytics avanzados** | No |
| **Protección con contraseña** | No |

### Pago Único (Crédito Premium)

| Característica | Valor |
|---|---|
| **Precio** | 9,99€ (pago único) |
| **Tipo** | `payment` (one-time) |
| **Lookup Key** | `flipbook_single_purchase` |
| **Qué da** | +1 crédito premium |
| **Max tamaño PDF** | 200 MB (por crédito) |
| **Max flipbooks** | 1 por compra (acumulable) |
| **Max páginas/flipbook** | 200 |
| **Dominio personalizado** | No |
| **Analytics avanzados** | Sí |
| **Protección con contraseña** | Sí |
| **Expiración** | Nunca (el flipbook no caduca) |

> **Nota:** Cada compra añade +1 crédito premium al usuario. Los créditos se consumen al crear un flipbook que exceda los límites del plan gratuito (archivo > 50MB o slots gratuitos agotados).

### Plan Pro (Suscripción Mensual)

| Característica | Valor |
|---|---|
| **Precio** | 7,99€/mes |
| **Tipo** | `subscription` (recurrente) |
| **Lookup Key** | `flipbook_pro_monthly` |
| **Max tamaño PDF** | 200 MB |
| **Max flipbooks** | Ilimitados |
| **Max páginas/flipbook** | 200 |
| **Dominio personalizado** | No |
| **Analytics avanzados** | Sí |
| **Protección con contraseña** | Sí |
| **Soporte** | Prioritario |

### Plan Business (Suscripción Mensual)

| Característica | Valor |
|---|---|
| **Precio** | 19,99€/mes |
| **Tipo** | `subscription` (recurrente) |
| **Lookup Key** | `flipbook_business_monthly` |
| **Max tamaño PDF** | 500 MB |
| **Max flipbooks** | Ilimitados |
| **Max páginas/flipbook** | 500 |
| **Dominio personalizado** | Sí |
| **Analytics avanzados** | Sí |
| **Protección con contraseña** | Sí |
| **Soporte** | 24/7 |
| **API access** | Sí |

---

## Productos a crear en Stripe Dashboard

Hay que crear **3 productos** en el [Stripe Dashboard](https://dashboard.stripe.com/products):

### Producto 1: Crédito Premium FlipBook

```
Nombre:        Crédito Premium FlipBook
Descripción:   Un flipbook premium - hasta 200MB, 200 páginas, analytics y contraseña
```

**Precio asociado:**

```
Tipo:          One-time (pago único)
Importe:       9,99 EUR
Lookup Key:    flipbook_single_purchase
```

### Producto 2: FlipBook Pro

```
Nombre:        FlipBook Pro
Descripción:   Para creadores y pequeños negocios - flipbooks ilimitados
```

**Precio asociado:**

```
Tipo:          Recurring (recurrente)
Período:       Mensual
Importe:       7,99 EUR / mes
Lookup Key:    flipbook_pro_monthly
```

### Producto 3: FlipBook Business

```
Nombre:        FlipBook Business
Descripción:   Para equipos y empresas - máxima capacidad y dominio personalizado
```

**Precio asociado:**

```
Tipo:          Recurring (recurrente)
Período:       Mensual
Importe:       19,99 EUR / mes
Lookup Key:    flipbook_business_monthly
```

### Cómo configurar Lookup Keys en Stripe

1. Ve a **Products** en el Stripe Dashboard
2. Crea el producto con su nombre y descripción
3. Al crear el precio, despliega **"Additional options"**
4. En el campo **"Lookup key"** introduce el valor exacto indicado arriba
5. **Los lookup keys deben coincidir exactamente** con los valores del código

---

## Lookup Keys

Los lookup keys son la pieza clave que conecta el código con los precios de Stripe:

```typescript
// lib/stripe/config.ts
export const LOOKUP_KEYS = {
  pro: 'flipbook_pro_monthly',        // Suscripción Pro
  business: 'flipbook_business_monthly', // Suscripción Business
  single: 'flipbook_single_purchase'   // Pago único
}
```

El checkout busca precios por lookup key (no por Price ID directamente), lo que permite actualizar precios en Stripe sin tocar el código:

```typescript
const prices = await stripe.prices.list({
  lookup_keys: [lookup_key],
  expand: ['data.product']
})
```

---

## Flujo de pago (Checkout)

### Endpoint: `POST /api/stripe/checkout`

**Request body:**
```json
{
  "lookup_key": "flipbook_pro_monthly"
}
```

### Flujo completo:

```
Usuario clicka "Empezar con Pro"
         │
         ▼
POST /api/stripe/checkout { lookup_key: "flipbook_pro_monthly" }
         │
         ├── ¿Usuario autenticado? ──No──▶ 401 → Redirige a /auth/login
         │
         ├── ¿Tiene stripe_customer_id? ──No──▶ Crea customer en Stripe
         │
         ├── Busca precio por lookup_key
         │
         ├── ¿Es plan "single"?
         │   ├── Sí → Crea session con mode: "payment"
         │   │        success_url: /create?purchase=success
         │   │        metadata: { type: "one_time", plan: "single" }
         │   │
         │   └── No → Crea session con mode: "subscription"
         │            success_url: /pricing?success=true
         │            metadata: { plan: "pro" | "business" }
         │
         ▼
Redirige a Stripe Checkout (session.url)
         │
         ▼
Stripe procesa el pago
         │
         ▼
Webhook: checkout.session.completed → Actualiza Supabase
```

### Metadata en la sesión de checkout

| Campo | Valor | Uso |
|---|---|---|
| `user_id` | UUID de Supabase | Identificar al usuario en el webhook |
| `plan` | `"single"`, `"pro"`, `"business"` | Determinar qué plan activar |
| `type` | `"one_time"` (solo para single) | Distinguir pago único vs suscripción |

---

## Webhooks de Stripe

### Endpoint: `POST /api/stripe/webhook`

### Eventos manejados:

| Evento | Acción |
|---|---|
| `checkout.session.completed` | Activa plan o añade crédito premium |
| `customer.subscription.updated` | Actualiza estado, período y cancelación |
| `customer.subscription.deleted` | Downgrade a plan Free |
| `invoice.payment_failed` | Marca suscripción como `past_due` |

### Detalle de `checkout.session.completed`:

**Para pago único (single):**
1. Lee `premium_credits` actual del usuario
2. Hace upsert sumando +1 crédito: `premium_credits: currentCredits + 1`
3. Mantiene el plan existente (no cambia a "single", sigue siendo "free" o lo que tuviera)

**Para suscripción (pro/business):**
1. Hace upsert con todos los datos del plan:
   - `plan`, `status: 'active'`
   - `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`
   - Límites: `max_file_size_mb`, `max_flipbooks`, `max_pages_per_book`
   - Features: `custom_domain`, `advanced_analytics`, `password_protection`

### Detalle de `customer.subscription.deleted`:

Resetea al usuario a plan Free con todos los límites gratuitos:
- `plan: 'free'`, `status: 'canceled'`
- `max_file_size_mb: 50`, `max_flipbooks: 3`, `max_pages_per_book: 50`
- `custom_domain: false`, `advanced_analytics: false`, `password_protection: false`

### Configuración del webhook en Stripe:

```
URL: https://tu-dominio.com/api/stripe/webhook
Eventos a escuchar:
  - checkout.session.completed
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_failed
```

---

## Base de datos (Supabase)

### Tabla: `fb_subscriptions`

| Columna | Tipo | Default | Descripción |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `user_id` | uuid | — | FK → `auth.users.id` (unique) |
| `stripe_customer_id` | text | null | ID del customer en Stripe (`cus_...`) |
| `stripe_subscription_id` | text | null | ID de la suscripción (`sub_...`), null para free/single |
| `stripe_price_id` | text | null | Lookup key del precio activo |
| `plan` | text | `'free'` | `'free'` \| `'pro'` \| `'business'` |
| `status` | text | `'active'` | `'active'` \| `'canceled'` \| `'past_due'` \| `'trialing'` |
| `max_file_size_mb` | int | 30 | Límite de tamaño de archivo en MB |
| `max_flipbooks` | int | 3 | Máx flipbooks (-1 = ilimitado) |
| `max_pages_per_book` | int | 50 | Máx páginas por flipbook |
| `remove_watermark` | bool | false | Marca de agua removida |
| `custom_domain` | bool | false | Acceso a dominio personalizado |
| `advanced_analytics` | bool | false | Analytics avanzados habilitados |
| `password_protection` | bool | false | Protección con contraseña habilitada |
| `premium_credits` | int | 0 | Créditos premium de compras únicas |
| `current_period_start` | timestamptz | null | Inicio del período de facturación |
| `current_period_end` | timestamptz | null | Fin del período de facturación |
| `cancel_at_period_end` | bool | false | Si se cancelará al final del período |
| `created_at` | timestamptz | `now()` | Fecha de creación |
| `updated_at` | timestamptz | `now()` | Última actualización |

> **Importante:** La columna `plan` solo admite `'free'`, `'pro'` y `'business'` (CHECK constraint). Los créditos premium se gestionan por separado con `premium_credits`.

---

## Lógica de negocio y permisos

### Función: `canUserCreateFlipbook(userId, fileSizeMB)`

```
¿Usuario autenticado?
├── No → ¿Archivo > 50MB? → Bloqueado (requiresPremium)
│         └── No → Permitido (free anónimo)
│
└── Sí → Obtener suscripción + conteo de flipbooks
         │
         ├── ¿Plan Pro o Business?
         │   └── ¿Archivo > límite del plan? → Bloqueado / Permitido
         │
         ├── ¿Archivo > 50MB? (usuario free)
         │   ├── ¿Tiene premium_credits > 0? → Permitido (consumirá 1 crédito)
         │   └── No → Bloqueado → "Necesitas Pro (7,99€/mes) o crédito premium (9,99€)"
         │
         └── ¿Flipbooks >= máximo del plan free (3)?
             ├── ¿Tiene premium_credits > 0? → Permitido (consumirá 1 crédito)
             └── No → Bloqueado → "Actualiza a Pro para flipbooks ilimitados"
```

### Sistema de créditos premium

1. **Compra:** Cada pago único de 9,99€ suma +1 a `premium_credits`
2. **Consumo:** Se consume 1 crédito al crear un flipbook que:
   - Tenga un archivo > 50MB, o
   - El usuario free haya agotado sus 3 slots gratuitos
3. **Acumulable:** Los créditos no expiran y se pueden comprar múltiples veces
4. **Compatible:** Un usuario Pro/Business NO consume créditos (ya tiene acceso ilimitado)

### Límites de tamaño según contexto

```typescript
function getFileSizeLimit(subscription):
  - Sin suscripción (anónimo):     50 MB (FREE_FILE_SIZE_LIMIT_MB)
  - Plan free sin créditos:         50 MB
  - Plan free CON créditos:        200 MB (límite del plan single)
  - Plan Pro:                      200 MB
  - Plan Business:                 500 MB
```

---

## Portal de facturación

### Endpoint: `POST /api/stripe/portal`

Crea una sesión del [Stripe Billing Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal) para que el usuario pueda:

- Ver su suscripción actual
- Actualizar método de pago
- Cancelar suscripción
- Ver historial de facturas

**Return URL:** `/dashboard`

---

## Variables de entorno necesarias

```env
# Stripe - Server-side
STRIPE_SECRET_KEY=sk_live_...          # Clave secreta de Stripe
STRIPE_WEBHOOK_SECRET=whsec_...        # Secreto del webhook endpoint

# Stripe - Client-side
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Clave pública de Stripe

# Supabase (ya existentes)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # Para el webhook (admin access)

# App
NEXT_PUBLIC_APP_URL=https://tu-dominio.com  # URLs de redirección
```

> **Para desarrollo local:** Usar claves de test (`sk_test_...`, `pk_test_...`) y el [Stripe CLI](https://stripe.com/docs/stripe-cli) para redirigir webhooks:
> ```bash
> stripe listen --forward-to localhost:3000/api/stripe/webhook
> ```

---

## Checklist de configuración en Stripe

### 1. Crear productos y precios

- [ ] Crear producto **"Crédito Premium FlipBook"** con precio 9,99€ one-time, lookup key: `flipbook_single_purchase`
- [ ] Crear producto **"FlipBook Pro"** con precio 7,99€/mes, lookup key: `flipbook_pro_monthly`
- [ ] Crear producto **"FlipBook Business"** con precio 19,99€/mes, lookup key: `flipbook_business_monthly`

### 2. Configurar webhook

- [ ] Crear webhook endpoint apuntando a `https://tu-dominio.com/api/stripe/webhook`
- [ ] Suscribir a los eventos:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- [ ] Copiar el signing secret (`whsec_...`) a `STRIPE_WEBHOOK_SECRET`

### 3. Configurar Customer Portal

- [ ] Ir a Settings → Billing → Customer Portal
- [ ] Habilitar: actualizar método de pago, cancelar suscripción, ver facturas
- [ ] Configurar los productos que se muestran en el portal

### 4. Variables de entorno

- [ ] Configurar `STRIPE_SECRET_KEY` en producción
- [ ] Configurar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` en producción
- [ ] Configurar `STRIPE_WEBHOOK_SECRET` en producción
- [ ] Verificar `NEXT_PUBLIC_APP_URL` apunta al dominio correcto

### 5. Testing

- [ ] Probar checkout de pago único con tarjeta de test (`4242 4242 4242 4242`)
- [ ] Probar checkout de suscripción Pro
- [ ] Probar checkout de suscripción Business
- [ ] Verificar que los webhooks actualizan `fb_subscriptions` correctamente
- [ ] Probar cancelación desde el Customer Portal
- [ ] Probar que los límites se aplican correctamente tras cada cambio de plan

---

## Resumen visual de precios

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLIPBOOK PRICING                             │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│     FREE     │  PAGO ÚNICO  │     PRO      │       BUSINESS        │
│     0€       │   9,99€      │  7,99€/mes   │     19,99€/mes        │
├──────────────┼──────────────┼──────────────┼────────────────────────┤
│ 50 MB        │ 200 MB       │ 200 MB       │ 500 MB                │
│ 3 flipbooks  │ +1 crédito   │ Ilimitados   │ Ilimitados            │
│ 50 págs      │ 200 págs     │ 200 págs     │ 500 págs              │
│ ✗ Analytics  │ ✓ Analytics  │ ✓ Analytics  │ ✓ Analytics           │
│ ✗ Contraseña │ ✓ Contraseña │ ✓ Contraseña │ ✓ Contraseña          │
│ ✗ Dominio    │ ✗ Dominio    │ ✗ Dominio    │ ✓ Dominio custom      │
│              │              │ ✓ Soporte    │ ✓ Soporte 24/7        │
│              │              │   prioritario│ ✓ API access          │
└──────────────┴──────────────┴──────────────┴────────────────────────┘
```

---

## Archivos del proyecto relacionados

| Archivo | Descripción |
|---|---|
| `lib/stripe/config.ts` | Configuración de planes, lookup keys, límites y features |
| `lib/stripe/client.ts` | Cliente Stripe del lado del navegador (loadStripe) |
| `lib/stripe/subscription.ts` | Lógica de permisos, créditos y límites por plan |
| `app/api/stripe/checkout/route.ts` | API para crear sesiones de checkout |
| `app/api/stripe/webhook/route.ts` | Webhook handler para eventos de Stripe |
| `app/api/stripe/portal/route.ts` | API para crear sesiones del billing portal |
| `app/(main)/pricing/page.tsx` | Página de precios (UI) |

---

*Última actualización: Febrero 2026*
