A continuación se presenta la especificación completa del modelo de datos para Supabase/PostgreSQL en formato Markdown, estructurada para copiar y guardar directamente como archivo soloflow_database_schema.md.

# SoloFlow - Modelo de Datos Refinado (Supabase / PostgreSQL)

## 1. Entidad Principal y Justificación de Arquitectura

La entidad principal del sistema es **`DraftLog` (Registros Borradores)**.
* **Justificación:** Es la unidad atómica de captura y el núcleo que resuelve los dos problemas de raíz del usuario:
  1. Permite la ingesta sin temporizadores invasivos durante la jornada diaria (Pantalla 1 - Captura).
  2. Alimenta el proceso de triaje semanal para ser agrupado en entregables macro (Pantalla 2 - Triaje).
  3. Provee la evidencia de bajo nivel que la IA sintetiza sin exponerla al cliente (Pantalla 3 - Redactor).
  4. Respalda el cálculo de horas facturables y montos del cierre semanal (Pantalla 4 - Reporte).

---

## 2. Diagrama Entidad-Relación (Relaciones Lógicas)

```text
  ┌─────────────────────────┐
  │          users          │
  └────────────┬────────────┘
               │ 1
               │
               │ N
  ┌────────────▼────────────┐
  │         clients         │
  └────────────┬────────────┘
               │ 1
               ├─────────────────────────────────────────┐
               │ N                                       │ N
  ┌────────────▼────────────┐               ┌────────────▼────────────┐
  │        milestones       │               │         reports         │
  │ (Hitos de Alto Nivel)   │               │   (Despacho Oficial)    │
  └────────────┬────────────┘               └────────────┬────────────┘
               │ 1 (opcional)                            │ 1
               │                                         │
               │ N                                       │ N (opcional)
  ┌────────────▼────────────┐                            │
  │        draft_logs       │ ◄──────────────────────────┘
  │   (ENTIDAD PRINCIPAL)   │ (Relacionado vía Milestone.report_id)
  └─────────────────────────┘
3. Diccionario de Datos y Mapeo con Pantallas
A. Tabla: users (Perfil del Especialista)
Campo	Tipo	Restricción	Justificación / Pantalla de uso
id	UUID	PRIMARY KEY DEFAULT gen_random_uuid()	Identificador único interno.
name	VARCHAR(100)	NOT NULL	Pantalla 4: Nombre del especialista en el membrete oficial ("Martín S.").
role_title	VARCHAR(100)	NOT NULL	Pantallas 1 y 4: Cargo exhibido ("Sr. Engineer" / "Consultor").
email	VARCHAR(150)	UNIQUE NOT NULL	Identificación y acceso a Supabase Auth.
created_at	TIMESTAMPTZ	DEFAULT NOW()	Fecha de registro del usuario.
B. Tabla: clients (Clientes y Cuentas Activas)
Campo	Tipo	Restricción	Justificación / Pantalla de uso
id	UUID	PRIMARY KEY DEFAULT gen_random_uuid()	Identificador único del cliente.
user_id	UUID	REFERENCES users(id) ON DELETE CASCADE	Llave foránea que asocia el cliente con Martín.
name	VARCHAR(120)	NOT NULL	Pantallas 1, 2, 3 y 4: Nombre comercial ("Fintech Nova Inc.", "HealthPulse").
code	VARCHAR(20)	NULL	Pantallas 1 y 3: Código corto para chips ("[CLI-01]", "FN").
default_channel	VARCHAR(80)	NULL	Pantalla 1: Canal informal vinculado ("Slack #eng-core", "Discord #api-dev").
hourly_rate	DECIMAL(10,2)	NOT NULL	Pantallas 1, 2, 3 y 4: Tarifa horaria activa ("$85/h").
billing_cycle	VARCHAR(50)	NULL	Pantalla 3: Modalidad de liquidación ("Facturación quincenal - Ciclo activo").
created_at	TIMESTAMPTZ	DEFAULT NOW()	Auditoría de creación.
C. Tabla: draft_logs (Entidad Principal - Micro-tareas y Borradores)
Campo	Tipo	Restricción	Justificación / Pantalla de uso
id	UUID	PRIMARY KEY DEFAULT gen_random_uuid()	Identificador único. Pantalla 2: ID visible en tarjeta ("#4092").
client_id	UUID	REFERENCES clients(id) ON DELETE CASCADE	Pantallas 1 y 2: Asignación al cliente y filtros por tabs.
milestone_id	UUID	NULLABLE REFERENCES milestones(id) ON DELETE SET NULL	Pantalla 2: Agrupación en Hito. Es NULL mientras sea borrador pendiente.
description	TEXT	NOT NULL	Pantallas 1 y 2: Texto ingresado en "¿Qué resolviste hoy?" y lista cruda.
duration_minutes	INT	NOT NULL	Pantallas 1 y 2: Carga con bloques predeterminados (15, 30, 60, 120 min).
tags	TEXT[]	DEFAULT '{}'	Pantalla 1: Etiquetas técnicas asignadas ("#Backend", "#Fix Crítico").
logged_at	TIMESTAMPTZ	DEFAULT NOW()	Pantallas 1 y 2: Timestamp de la tarea ("Jueves 14 Mar", "Martes 12 Mar").
status	VARCHAR(20)	DEFAULT 'pending'	Pantalla 2: Estado de triaje: 'pending', 'grouped', 'discarded'.
is_client_visible	BOOLEAN	DEFAULT false	Pantalla 3 y 4: Blindaje: garantiza que el log técnico no se exponga al cliente.
created_at	TIMESTAMPTZ	DEFAULT NOW()	Registro de auditoría.
D. Tabla: milestones (Hitos y Entregables de Alto Nivel)
Campo	Tipo	Restricción	Justificación / Pantalla de uso
id	UUID	PRIMARY KEY DEFAULT gen_random_uuid()	Identificador único del hito.
client_id	UUID	REFERENCES clients(id) ON DELETE CASCADE	Cliente al que corresponde el entregable.
report_id	UUID	NULLABLE REFERENCES reports(id) ON DELETE SET NULL	Pantalla 4: Asociación con el reporte semanal despachado.
code	VARCHAR(20)	NULL	Pantalla 4: Numeración ordinal visible ("HITO 01", "HITO 02").
category	VARCHAR(80)	NULL	Pantalla 4: Rótulo temático ("LATENCIA & RESILIENCIA", "DEVOPS & CALIDAD").
title	VARCHAR(180)	NOT NULL	Pantallas 2 y 4: Nombre macro ("Optimización de Latencia y Checkout").
description	TEXT	NULL	Pantalla 4: Párrafo narrativo consolidado del trabajo realizado.
impact_bullets	TEXT[]	DEFAULT '{}'	Pantallas 3 y 4: Viñetas editables con check ("Reducción del tiempo P95...").
consolidated_hours	DECIMAL(5,2)	DEFAULT 0.00	Pantallas 2 y 4: Horas sumadas por conciliación ("12.0h").
estimated_hours	DECIMAL(5,2)	NULL	Pantalla 2: Horas presupuestadas para la barra de progreso ("8h 45m / 12h").
status	VARCHAR(20)	DEFAULT 'active'	Pantallas 2 y 4: Estado del hito: 'active', 'in_review', 'completed'.
created_at	TIMESTAMPTZ	DEFAULT NOW()	Fecha de apertura del hito.
E. Tabla: reports (Despacho Oficial / Reporte de Cierre)
Campo	Tipo	Restricción	Justificación / Pantalla de uso
id	UUID	PRIMARY KEY DEFAULT gen_random_uuid()	Identificador único interno.
client_id	UUID	REFERENCES clients(id) ON DELETE RESTRICT	Cliente que recibe el reporte y factura.
report_code	VARCHAR(50)	NOT NULL	Pantalla 4: Código oficial ("DESPACHO OFICIAL #RPT-2025-011").
period_start	DATE	NOT NULL	Pantalla 4: Fecha de inicio del ciclo ("10 Mar, 2025").
period_end	DATE	NOT NULL	Pantalla 4: Fecha de fin del ciclo ("16 Mar, 2025").
executive_tone	VARCHAR(30)	DEFAULT 'roi_business'	Pantalla 3: Tono aplicado: 'roi_business', 'tech_exec', 'bullets'.
total_billable_hours	DECIMAL(6,2)	NOT NULL	Pantalla 4: Total de horas facturables consolidadas ("28.5h").
hourly_rate_snapshot	DECIMAL(10,2)	NOT NULL	Inmutabilidad: Tarifa horaria congelada al momento de emitir el reporte.
total_amount	DECIMAL(10,2)	NOT NULL	Pantalla 4: Liquidación económica calculada ("$2,422.50").
markdown_preview	TEXT	NULL	Pantalla 4: Texto enriquecido listo para el botón "Copiar Markdown".
public_token	VARCHAR(64)	UNIQUE NULL	Pantalla 4: Hash para la URL pública interactiva de solo lectura.
is_public_enabled	BOOLEAN	DEFAULT true	Pantalla 4: Estado del switch de activación del enlace compartido.
expires_at	TIMESTAMPTZ	NULL	Pantalla 4: Fecha de caducidad automática para el switch de 7 días.
status	VARCHAR(20)	DEFAULT 'draft'	Pantallas 3 y 4: Estado: 'draft', 'approved', 'dispatched'.
created_at	TIMESTAMPTZ	DEFAULT NOW()	Fecha exacta de generación del reporte.
4. Script SQL de Inicialización (DDL para Supabase)
-- Habilitar extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabla de Usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  role_title VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(20),
  default_channel VARCHAR(80),
  hourly_rate DECIMAL(10,2) NOT NULL CHECK (hourly_rate >= 0),
  billing_cycle VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Reportes Consolidados (Despacho)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  report_code VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  executive_tone VARCHAR(30) DEFAULT 'roi_business' 
    CHECK (executive_tone IN ('roi_business', 'tech_exec', 'bullets')),
  total_billable_hours DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  hourly_rate_snapshot DECIMAL(10,2) NOT NULL CHECK (hourly_rate_snapshot >= 0),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  markdown_preview TEXT,
  public_token VARCHAR(64) UNIQUE,
  is_public_enabled BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'draft' 
    CHECK (status IN ('draft', 'approved', 'dispatched')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Hitos (Entregables Macro)
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  code VARCHAR(20),
  category VARCHAR(80),
  title VARCHAR(180) NOT NULL,
  description TEXT,
  impact_bullets TEXT[] DEFAULT '{}',
  consolidated_hours DECIMAL(5,2) DEFAULT 0.00,
  estimated_hours DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'active' 
    CHECK (status IN ('active', 'in_review', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Draft Logs (Entidad Principal - Micro-tareas)
CREATE TABLE draft_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  tags TEXT[] DEFAULT '{}',
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'grouped', 'discarded')),
  is_client_visible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices recomendados para rendimiento
CREATE INDEX idx_draft_logs_client_status ON draft_logs(client_id, status);
CREATE INDEX idx_draft_logs_milestone ON draft_logs(milestone_id);
CREATE INDEX idx_milestones_client_status ON milestones(client_id, status);
CREATE INDEX idx_milestones_report ON milestones(report_id);
CREATE INDEX idx_reports_public_token ON reports(public_token) WHERE public_token IS NOT NULL;
    