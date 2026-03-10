# FlowState - Academia de Baile en Linea

Proyecto academico de Desarrollo Web - Universidad del Valle (Univalle)
Asignatura: 4to Semestre - Desarrollo Web

## Descripcion

FlowState es una plataforma de e-commerce especializada en la venta de coreografias de baile en video. Conecta a instructores profesionales con aprendices de baile, ofreciendo un catalogo organizado por generos (salsa, bachata, urbano, etc.), niveles de dificultad y precios accesibles.

## Objetivos del Proyecto

- Desarrollar una aplicacion full-stack con arquitectura REST API
- Implementar autenticacion JWT con roles (Director, Admin, Profesor, Cliente)
- Crear un e-commerce funcional con carrito de compras y checkout simulado
- Visualizar metricas de negocio con dashboards interactivos
- Practicar metodologia SCRUM con Sprints de 2 semanas

## Stack Tecnologico

**Backend:**

- Python 3.11+
- Django 5.0
- Django REST Framework 3.14
- Simple JWT 5.3 (autenticacion)
- PostgreSQL 15 (Supabase)
- CORS Headers 4.3

**Frontend:**

- React 18.2
- Vite 5.0
- React Router DOM 6.20
- Axios 1.6
- Context API (state management)
- Tailwind CSS 3.4
- ApexCharts 3.45 (graficos)

**Herramientas:**

- Git + GitHub (GitFlow)
- ESLint + Prettier
- Black + isort
- Render/Vercel (deploy opcional)

## Estructura del Proyecto

```
FlowState/
├── backend/                    # Django REST API
│   ├── apps/
│   │   ├── users/             # EPIC-001: Gestion de Usuarios
│   │   ├── customers/         # EPIC-002: Gestion de Clientes
│   │   ├── catalog/           # EPIC-004: Catalogo de Coreografias
│   │   ├── sales/             # EPIC-005: Carrito y Checkout
│   │   └── dashboard/         # EPIC-003: Analytics
│   ├── flowstate_backend/     # Configuracion Django
│   ├── requirements/          # Dependencias
│   └── manage.py
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/             # Vistas
│   │   ├── contexts/          # AuthContext, CartContext
│   │   ├── hooks/             # useAuth, useApi
│   │   ├── services/          # Axios configurado
│   │   └── assets/            # Imagenes, estilos
│   └── package.json
├── docs/                       # Documentacion
└── README.md
```

## Instalacion y Configuracion

### Prerrequisitos

- Python 3.11+ (https://www.python.org/downloads/)
- Node.js 18+ (https://nodejs.org/)
- Git (https://git-scm.com/)
- Cuenta en Supabase (https://supabase.com/) o PostgreSQL local

### Paso 1: Clonar el Repositorio

```powershell
git clone https://github.com/tu-usuario/flowstate.git
cd flowstate
```

### Paso 2: Configurar Backend (Django)

**Crear y activar entorno virtual (OBLIGATORIO):**

```powershell
python -m venv venv
.env\Scripts\Activate.ps1
```

Si da error de ejecucion de scripts, ejecutar primero:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Instalar dependencias:**

```powershell
pip install -r backend/requirements/local.txt
```

**Configurar variables de entorno:**

```powershell
copy backend\.env.example backend\.env
```

Editar backend/.env con tus credenciales de Supabase.

**Aplicar migraciones y crear superusuario:**

```powershell
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

**Iniciar servidor backend:**

```powershell
python manage.py runserver
```

API disponible en: http://127.0.0.1:8000/api/v1/

### Paso 3: Configurar Frontend (React)

En otra terminal:

```powershell
cd frontend
npm install          # Solo la primera vez
npm run dev          # Iniciar servidor de desarrollo
```

Frontend disponible en: http://localhost:5173

### Paso 4: Verificar Instalacion

- Backend: http://127.0.0.1:8000/admin/ (panel Django)
- API Docs: http://127.0.0.1:8000/api/v1/ (endpoints REST)
- Frontend: http://localhost:5173/ (aplicacion React)

## Roadmap del Proyecto (Metodologia SCRUM)

**Sprint 0: Research & Training (2 semanas)**

- Investigacion Django REST Framework
- Investigacion React.js
- Configuracion entorno de desarrollo
- Modelado de Base de Datos
- Diseno de BPM

**Sprint 1: Autenticacion Base (2 semanas) - 13 SP**

- US-001: Registro de Administrador/Director con CAPTCHA
- US-002: Login con Roles y JWT

**Sprint 2: Perfiles y Registro Clientes (2 semanas) - 8 SP**

- US-003: Gestion de Perfil y Cambio de Contrasena
- US-004: Auto-registro de Clientes con verificacion email

**Sprint 3: Gestion de Contenido (2 semanas) - 8 SP**

- US-007: CRUD de Coreografias (Admin/Profesor)

**Sprint 4: Catalogo y Perfil Cliente (2 semanas) - 10 SP**

- US-008: Visualizacion del Catalogo (Clientes)
- US-005: Perfil de Cliente y Historial de Compras

**Sprint 5: E-commerce Completo (2 semanas) - 13 SP**

- US-009: Carrito de Compras persistente
- US-010: Checkout y Simulacion de Pagos (PSE/Tarjeta)

**Sprint 6: Dashboard y Reportes (2 semanas) - 8 SP**

- US-006: Dashboard Administrativo con ApexCharts

**Total:** 60 Story Points | 12-14 semanas | 10 Historias de Usuario

## Funcionalidades Principales

**Gestion de Usuarios (RBAC):**

- Roles: Director, Administrador, Profesor, Cliente
- Registro con CAPTCHA (Google reCAPTCHA v2)
- Autenticacion JWT con access/refresh tokens
- Bloqueo tras 5 intentos fallidos, validacion de email

**Catalogo de Coreografias:**

- CRUD completo para profesores
- Upload de videos a Supabase Storage (mp4, max 500MB)
- Thumbnails auto-generados o manuales
- Estados: Borrador, Publicado, Archivado
- Busqueda full-text por titulo y descripcion

**E-commerce:**

- Carrito persistente: localStorage (anonimo) + DB (logueado)
- Checkout multi-paso: Datos -> Metodo de pago -> Confirmacion
- Pasarela simulada: PSE (lista de bancos mock) y Tarjeta de credito
- Idempotencia: Evita cobros duplicados
- Facturacion: PDF generado con ReportLab

**Dashboard Analytics:**

- KPIs en tiempo real: Ventas del mes, usuarios nuevos, top coreografias
- Graficos ApexCharts: Lineas (ventas 6 meses), Dona (por genero), Barras (top clientes)
- Filtros de fecha: Rango personalizable
- Exportacion: Datos a CSV

## Variables de Entorno (.env)

Crear archivo backend/.env:

```
# Django
SECRET_KEY=tu-clave-secreta-aqui-cambia-en-produccion
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (Supabase)
DB_NAME=flowstate
DB_USER=postgres
DB_PASSWORD=tu-password-supabase
DB_HOST=xxxx.supabase.co
DB_PORT=5432

# Email (Mock en desarrollo)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# JWT
ACCESS_TOKEN_LIFETIME=60
REFRESH_TOKEN_LIFETIME=1440
```

## Testing

**Backend (Django):**

```powershell
cd backend
python manage.py test apps.users.tests
python manage.py test apps.catalog.tests
```

**Frontend (React):**

```powershell
cd frontend
npm run test
```

## Deploy (Produccion)

**Opcion 1: Render (Backend) + Vercel (Frontend)**

Backend en Render:

- Conectar repo, seleccionar Python
- Build Command: pip install -r requirements/production.txt
- Start Command: gunicorn flowstate_backend.wsgi:application
- Variables de entorno en dashboard de Render

Frontend en Vercel:

- Conectar repo, seleccionar Vite
- Build Command: npm run build
- Output Directory: dist
- Variable VITE_API_URL apuntando a Render

**Opcion 2: Docker (Local/Produccion)**

```powershell
docker-compose up --build
```

## Contribucion

Este es un proyecto academico, pero las contribuciones son bienvenidas:

1. Fork el repositorio
2. Crea una rama: git checkout -b feature/nueva-funcionalidad
3. Commit: git commit -m "Add: descripcion clara"
4. Push: git push origin feature/nueva-funcionalidad
5. Pull Request a develop

**Convenciones de Codigo:**

- Python: PEP8, Black (black .), isort (isort .)
- JavaScript: ESLint, Prettier (npm run lint)
- Commits: Conventional Commits (feat:, fix:, docs:, refactor:)

## Documentacion Adicional

- docs/API.md - Endpoints y ejemplos de uso
- docs/ARCHITECTURE.md - Diagramas y decisiones tecnicas
- docs/DEPLOY.md - Guia paso a paso para produccion
- docs/backlog.csv - Historias de usuario completas

## Autor

Juan David SPñarte
Estudiante de Ingenieria de Sistemas - Universidad del Valle
Correo: juan.david.solarte@correounivalle.edu.co
GitHub: https://github.com/juandavidsolarte/FlowState---DanceProject.git

Profesora: Beatriz Florián Gaviria, Ph.D.
Asignatura: Desarrollo Web - 2026

## Licencia

Este proyecto es de uso academico para la Universidad del Valle.
Codigo disponible bajo licencia MIT para fines educativos.

---

FlowState - Baila sin limites, aprende sin fronteras
