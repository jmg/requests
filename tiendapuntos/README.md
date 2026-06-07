# TiendaPuntos — App de fidelización de clientes

Plataforma de **programa de puntos / fidelización** para negocios, estilo
[tiendadepuntos.com](https://www.tiendadepuntos.com/). Cada negocio tiene su propio espacio
(multi-tenant) y puede tener varios usuarios con distintos roles.

Construida con **Next.js 14 (App Router)**, **Prisma** y **PostgreSQL**.

## ✨ Funcionalidades

### Núcleo
- **Multiusuario / multi-negocio (SaaS)**: cada cuenta crea su negocio aislado. Datos separados por negocio (tenant).
- **Roles**: Dueño (`OWNER`), Administrador (`ADMIN`) y Cajero (`STAFF`).
- **Clientes**: alta, edición, búsqueda y ficha con saldo e historial.
- **Sumar puntos**: por monto de compra (según puntos por unidad de moneda configurable) o por cantidad fija.
- **Premios**: catálogo con costo en puntos, stock (o ilimitado) y activación.
- **Canjes**: el cliente canjea puntos por premios; se genera un código y se descuenta stock.
  Los canjes se pueden marcar como entregados o cancelar (devolviendo los puntos).
- **Ajustes manuales** de puntos (+/-).
- **Movimientos**: registro completo y paginado de todas las transacciones, con quién las cargó.
- **Resumen**: métricas (clientes, puntos emitidos/canjeados, canjes pendientes, mejores clientes).
- **Configuración**: nombre del programa, nombre de los puntos, moneda, ratio de puntos y gestión del equipo.
- **Autenticación propia** con JWT en cookie httpOnly (`jose` + `bcryptjs`) y middleware de protección de rutas.

### SaaS
- **Portal público del cliente final** (`/p/[slug]`): página sin login donde el cliente consulta su saldo
  de puntos y premios disponibles ingresando su teléfono. Personalizada con el branding del negocio.
- **Planes y suscripción**: planes **Free** y **Pro** con límites por plan (clientes, premios, equipo).
  Los límites se aplican al crear registros. Cambio de plan desde `/dashboard/billing` (simulado, sin cobro real).
- **Onboarding**: checklist de bienvenida en el panel que guía los primeros pasos (marca, premio, cliente).
- **Branding por negocio**: color e ícono propios, usados en el panel y en el portal público.
- **Reportes y exportación** (Pro): gráfico de actividad mensual (puntos emitidos vs. canjeados) y
  exportación de clientes y movimientos a **CSV** (`/api/export/*`).

## 🛠️ Stack

| Capa            | Tecnología                          |
| --------------- | ----------------------------------- |
| Framework       | Next.js 14 (App Router, Server Actions) |
| Base de datos   | PostgreSQL                          |
| ORM             | Prisma                              |
| Auth            | JWT (jose) + bcryptjs + cookies     |
| Estilos         | Tailwind CSS                        |
| Validación      | Zod                                 |

## 🚀 Puesta en marcha

### 1. Requisitos
- Node.js 18+
- PostgreSQL (o Docker)

### 2. Instalar dependencias
```bash
cd tiendapuntos
npm install
```

### 3. Variables de entorno
```bash
cp .env.example .env
```
Editá `.env`:
- `DATABASE_URL`: cadena de conexión a PostgreSQL.
- `AUTH_SECRET`: cadena larga y aleatoria (ej: `openssl rand -base64 32`).

### 4. Base de datos
Con Docker (opcional):
```bash
docker compose up -d
```
Crear el esquema y datos de demo:
```bash
npm run db:push     # crea las tablas
npm run db:seed     # carga el negocio de demo
```

### 5. Levantar la app
```bash
npm run dev
```
Abrí http://localhost:3000

### Cuentas de demo (tras el seed)
- **Dueño:** `demo@tiendapuntos.com` / `demo1234`
- **Cajero:** `caja@tiendapuntos.com` / `demo1234`

## 📁 Estructura

```
tiendapuntos/
├── prisma/
│   ├── schema.prisma        # modelo de datos (Business, User, Customer, Reward, ...)
│   └── seed.ts              # datos de demo
├── src/
│   ├── app/
│   │   ├── page.tsx         # landing
│   │   ├── login/ register/ # auth
│   │   ├── p/[slug]/        # portal público del cliente final
│   │   ├── api/export/      # exportación CSV (clientes / movimientos)
│   │   └── dashboard/       # panel (clientes, premios, canjes, movimientos, reportes, plan, config)
│   ├── components/          # UI reutilizable
│   ├── lib/
│   │   ├── auth.ts          # sesión JWT
│   │   ├── prisma.ts        # cliente Prisma
│   │   └── actions/         # server actions (lógica de negocio)
│   └── middleware.ts        # protección de rutas
└── docker-compose.yml       # PostgreSQL local
```

## 🧱 Modelo de datos

- **Business**: el negocio (tenant). Configura nombre de puntos, moneda y ratio de puntos.
- **User**: usuario del negocio, con rol.
- **Customer**: cliente del programa, con saldo de puntos denormalizado.
- **PointsTransaction**: cada movimiento de puntos (EARN / REDEEM / ADJUST).
- **Reward**: premio canjeable.
- **Redemption**: canje de un premio (con código y estado).

Los saldos se actualizan dentro de transacciones de base de datos para mantener la consistencia.

## 📝 Scripts

| Comando            | Descripción                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Servidor de desarrollo               |
| `npm run build`    | Build de producción                  |
| `npm run start`    | Servidor de producción               |
| `npm run db:push`  | Sincroniza el esquema con la DB      |
| `npm run db:migrate` | Crea/aplica migraciones            |
| `npm run db:seed`  | Carga datos de demo                  |
| `npm run db:studio`| Prisma Studio (explorar la DB)       |
