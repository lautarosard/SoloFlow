# SoloFlow - Backend API (MVP)

> API REST desarrollada con Node.js y Express bajo arquitectura MVC. Plataforma de productividad para desarrolladores independientes y contractors orientada a transformar actividad dispersa en narrativas ejecutivas de valor.

---

## 🛠️ Stack Tecnológico

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Módulos:** ECMAScript Modules (`"type": "module"`)
- **Arquitectura:** Modelo - Vista - Controlador (MVC)
- **Persistencia actual:** Mocks asíncronos en memoria (migración planificada a Supabase en C12)

---

## 📁 Estructura del Proyecto

```text
soloflow-backend/
├── docs/
│   └── modelo-datos.md       # Contrato de datos y especificación SQL
├── src/
│   ├── config/               # Variables de entorno y configuración
│   ├── controllers/          # Controladores HTTP y validaciones de entrada
│   │   ├── client.controller.js
│   │   └── draft-log.controller.js
│   ├── models/               # Modelos de datos en memoria (contrato desacoplado)
│   │   ├── client.model.js
│   │   └── draft-log.model.js
│   ├── routes/               # Definición y montaje de endpoints REST
│   │   ├── client.routes.js
│   │   ├── draft-log.routes.js
│   │   └── index.routes.js   # Router central (/api)
│   └── app.js                # Configuración de Express, CORS y middlewares
├── .env.example
├── index.js                  # Punto de entrada del servidor
├── package.json
└── README.md
```

---

## 🚀 Instalación y Puesta en Marcha

1. **Clonar el repositorio e instalar dependencias:**
   ```bash
   git clone <url-del-repo>
   cd soloflow-backend
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia el archivo `.env.example` como `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Valores por defecto: `PORT=3000` y `NODE_ENV=development`)*

3. **Iniciar el servidor en modo desarrollo:**
   ```bash
   npm run dev
   ```
   *El servidor quedará escuchando en `http://localhost:3000`.*

---

## 📋 Endpoints Disponibles

Todas las respuestas exitosas y de error mantienen el contrato estándar:
```json
{
  "status": "success", // o "error"
  "data": { ... }      // o "message": "Descripción del error"
}
```

### Health Check
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Verifica la disponibilidad de la API |

---

### 1. Clientes (`/api/clients`)
Entidad base asociada al usuario especialista (`user-martin-123`).

| Método | Endpoint | Código | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/clients` | 200 | Lista todos los clientes |
| `GET` | `/api/clients/:id` | 200 / 404 | Retorna un cliente por ID |
| `POST` | `/api/clients` | 201 / 400 | Crea un cliente (`name`, `hourly_rate` obligatorios) |
| `PATCH` | `/api/clients/:id` | 200 / 400 / 404 | Actualización parcial del cliente |
| `DELETE` | `/api/clients/:id` | 200 / 404 | Elimina un cliente |

#### Mocks precargados:
- `cli-fintech-01`: Fintech Nova Inc. ($85.00/h · Slack #eng-core)
- `cli-health-02`: HealthPulse ($90.00/h · Discord #api-dev)

---

### 2. Draft Logs (`/api/draft-logs`)
Entidad principal de captura de micro-tareas y actividad técnica.

| Método | Endpoint | Código | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/draft-logs` | 200 | Lista todos los logs en memoria |
| `GET` | `/api/draft-logs?clientId=:id` | 200 | **Filtro relacional:** logs asociados a un cliente |
| `GET` | `/api/draft-logs/:id` | 200 / 404 | Retorna un log específico |
| `POST` | `/api/draft-logs` | 201 / 400 | Crea un borrador (`client_id`, `description`, `duration_minutes > 0`) |
| `PATCH` | `/api/draft-logs/:id` | 200 / 400 / 404 | Actualización parcial (nunca PUT) |
| `DELETE` | `/api/draft-logs/:id` | 200 / 404 | Elimina un log |

#### Validaciones clave:
- `status`: Sólo acepta `'pending'`, `'grouped'`, `'discarded'`. Default: `'pending'`.
- `duration_minutes`: Entero estrictamente mayor a 0.
- `is_client_visible`: Booleano (default `false`) para proteger la evidencia técnica de la vista del cliente.

---

## 🧪 Pruebas de Verificación Rápida (cURL)

### Probar el filtro relacional (FK `client_id`):
```bash
curl -X GET "http://localhost:3000/api/draft-logs?clientId=cli-fintech-01"
```

### Probar validación de creación (espera 400 Bad Request):
```bash
curl -X POST http://localhost:3000/api/draft-logs \
  -H "Content-Type: application/json" \
  -d '{"client_id":"cli-fintech-01","description":"Test inválido","duration_minutes":0}'
```

### Probar actualización parcial con PATCH:
```bash
curl -X PATCH http://localhost:3000/api/draft-logs/log-4092 \
  -H "Content-Type: application/json" \
  -d '{"status":"grouped"}'
```