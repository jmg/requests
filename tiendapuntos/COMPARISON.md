# TiendaPuntos vs. la competencia

> Comparativa de posicionamiento de **TiendaPuntos** (esta app) frente a referentes de
> fidelización de clientes: un líder **internacional** y la competencia **local en Argentina**.
>
> ⚠️ Los precios y las funciones de terceros son **valores de referencia a principios de 2026** y
> pueden cambiar. La idea es ubicar a TiendaPuntos en el mapa competitivo, no dar una cotización exacta.

---

## 1. Los competidores elegidos

| | **TiendaPuntos** (este proyecto) | **Smile.io** (internacional, e‑commerce) | **Loyverse** (internacional, retail/POS) | **Tienda de Puntos** (Argentina) |
|---|---|---|---|---|
| Origen | Demo / propio | Canadá | EE.UU. / global | Argentina |
| Enfoque | Comercios chicos y medianos, multi‑rubro | Tiendas online (Shopify/BigCommerce/Wix) | Comercios físicos con punto de venta | Comercios físicos y locales en LATAM |
| Modelo | Web app multi‑tenant (SaaS) | App/plugin sobre e‑commerce | App POS + módulo de fidelización | Plataforma SaaS + app |
| Canal del cliente | Portal web por teléfono / QR | Widget en la tienda online | App móvil de clientes | Tarjeta/app de puntos |

**Por qué estos tres:**
- **Smile.io** es uno de los líderes globales de loyalty para **e‑commerce** (programas de puntos, referidos y VIP integrados a la tienda online).
- **Loyverse** es un referente global para **comercios físicos**: POS gratuito con módulo de puntos y app para clientes.
- **Tienda de Puntos** representa a la **competencia local argentina**: foco en el comercio de barrio, sin necesidad de e‑commerce.

---

## 2. Matriz de funcionalidades

| Funcionalidad | TiendaPuntos | Smile.io | Loyverse | Tienda de Puntos |
|---|:---:|:---:|:---:|:---:|
| Multi‑negocio / SaaS autoservicio | ✅ | ✅ | ✅ | ✅ |
| Sumar puntos por monto de compra | ✅ | ✅ | ✅ | ✅ |
| Sumar puntos por cantidad fija / manual | ✅ | ✅ | ✅ | ✅ |
| Catálogo de premios + canje con código | ✅ | ✅ | ✅ | ✅ |
| Control de stock de premios | ✅ | ➖ | ✅ | ➖ |
| Roles de equipo (dueño/admin/cajero) | ✅ | ✅ | ✅ | ✅ |
| Invitaciones de equipo por email | ✅ | ✅ | ✅ | ➖ |
| Portal del cliente final (autoconsulta) | ✅ | ✅ (widget) | ✅ (app) | ✅ (app) |
| Branding personalizable | ✅ | ✅ | ✅ (limitado) | ✅ |
| Reportes + exportación CSV | ✅ | ✅ | ✅ | ✅ |
| Planes con límites (free/pro) | ✅ | ✅ | ✅ | ✅ |
| Pagos / suscripción (Stripe) | ✅ | ✅ | ✅ | ✅ (medios locales) |
| Subdominio propio por negocio | ✅ | ➖ | ➖ | ➖ |
| QR del programa | ✅ | ➖ | ✅ | ✅ |
| Internacionalización ES/EN | ✅ | ✅ (multi‑idioma) | ✅ (multi‑idioma) | ➖ (ES) |
| Integración nativa con e‑commerce | ➖ | ✅ (Shopify, etc.) | ➖ | ➖ |
| Programa de referidos | ➖ (roadmap) | ✅ | ➖ | parcial |
| Niveles VIP / tiers | ➖ (roadmap) | ✅ | ➖ | parcial |
| App móvil nativa | ➖ (web responsive) | ➖ (web) | ✅ | ✅ |
| Punto de venta (POS) integrado | ➖ | ➖ | ✅ | ➖ |
| Campañas / notificaciones push o email | ➖ (roadmap) | ✅ | ✅ | ✅ |

Leyenda: ✅ disponible · ➖ no disponible / limitado.

---

## 3. Precios (referencia, principios 2026)

| | Plan gratis | Plan pago (desde) | Notas |
|---|---|---|---|
| **TiendaPuntos** | Sí (Free: 50 clientes, 5 premios, 2 usuarios) | Pro mensual (precio configurable) | Pago con Stripe; ideal sumar Mercado Pago para AR |
| **Smile.io** | Sí (funciones básicas) | Escala por pedidos/mes (planes en USD) | Costo crece con el volumen de la tienda |
| **Loyverse** | Sí (POS + loyalty básicos gratis) | Add‑ons mensuales por empleado/tienda | El loyalty básico es gratis; se paga por funciones avanzadas |
| **Tienda de Puntos** | Según plan local | Suscripción en ARS | Pensado para el mercado argentino |

> El diferencial de precio de TiendaPuntos es ofrecer un **Free funcional** con límites claros y un
> único salto a **Pro** sin cobrar por volumen de transacciones.

---

## 4. Fortalezas y debilidades de TiendaPuntos

### ✅ Dónde gana
- **Multi‑tenant real con subdominio por negocio**: cada comercio puede tener `sucursal.tudominio.com`,
  algo que ni Smile, ni Loyverse ni Tienda de Puntos ofrecen de forma nativa.
- **Sin depender de e‑commerce**: a diferencia de Smile.io, funciona para el comercio físico “de mostrador”.
- **Portal del cliente por teléfono + QR**: el cliente consulta sus puntos sin instalar nada.
- **Bilingüe ES/EN de fábrica**: ventaja sobre la competencia local (solo español).
- **Stack moderno y propio** (Next.js + Prisma + Postgres): personalizable al 100%, sin lock‑in.

### ⚠️ Dónde todavía pierde
- **Sin POS integrado** como Loyverse (que cubre venta + fidelización en un solo flujo).
- **Sin integración nativa con tiendas online** como Smile.io (Shopify, etc.).
- **Faltan referidos, niveles VIP y campañas** (email/push), que la competencia ya trae.
- **Sin app móvil nativa** para clientes (hoy es web responsive).
- **Medios de pago**: Stripe está listo, pero para Argentina conviene **Mercado Pago**.

---

## 5. Roadmap sugerido para cerrar la brecha

Ordenado por impacto/esfuerzo para competir mejor:

1. **Referidos** ("traé un amigo y ganen puntos") → iguala a Smile.io, alto impacto en captación.
2. **Niveles / tiers VIP** (Bronce/Plata/Oro con beneficios) → retención.
3. **Campañas**: email/WhatsApp a clientes por segmento (inactivos, cumpleaños, etc.).
4. **Mercado Pago** como medio de pago y de acreditación de puntos (clave para AR).
5. **PWA / app móvil** para el cliente final (notificaciones push, billetera de puntos).
6. **Integración Shopify/Tiendanube** para no quedar afuera del e‑commerce LATAM.

---

## 6. Conclusión

TiendaPuntos se ubica como una **plataforma de fidelización moderna, bilingüe y self‑service** para el
**comercio físico**, con un diferencial fuerte en **multi‑tenant + subdominios** y en no exigir una
tienda online. Frente a **Smile.io** cede el terreno del e‑commerce; frente a **Loyverse** cede el POS;
y frente a **Tienda de Puntos** compite de igual a igual en el mercado local, ganando en
**internacionalización** e **infraestructura propia**, pero debiendo sumar **referidos, tiers, campañas
y Mercado Pago** para igualar la propuesta comercial completa.
