# 🛡️ Guía Completa de Calidad y Seguridad de Código

> Fundamentos de análisis estático, configuración de SonarQube Cloud y mejores prácticas para el proyecto Multiomix

---

## 📚 Tabla de Contenidos

1. [Fundamentos de Calidad de Código](#-fundamentos-de-calidad-de-código)
2. [¿Qué es SonarQube?](#-qué-es-sonarqube)
3. [SonarQube Cloud vs Self-Hosted](#️-sonarqube-cloud-vs-self-hosted)
4. [Plan Gratuito de SonarQube Cloud](#-plan-gratuito-de-sonarqube-cloud)
5. [Análisis Automático vs Workflows](#-análisis-automático-vs-workflows)
6. [Configuración en Multiomix](#️-configuración-en-multiomix)
7. [Navegando SonarQube Cloud](#-navegando-sonarqube-cloud)
8. [Quality Gates](#-quality-gates)
9. [Quality Profiles](#-quality-profiles)
10. [Rules (Reglas)](#-rules-reglas)
11. [Mejores Prácticas](#-mejores-prácticas)

---

## 🎯 Fundamentos de Calidad de Código

### ¿Qué es SAST?

**SAST** (Static Application Security Testing) es el análisis de **código fuente** sin ejecutarlo para encontrar vulnerabilidades de seguridad.

```
📝 Código Fuente → 🔍 Análisis Estático → 🚨 Vulnerabilidades Detectadas
```

**Características:**
- ✅ Se ejecuta **sin correr la aplicación**
- ✅ Detecta problemas **temprano** en el desarrollo
- ✅ Analiza **todo el código**, no solo lo que se ejecuta
- ❌ Puede generar **falsos positivos**
- ❌ No detecta problemas de **runtime**

**Ejemplos de problemas que detecta:**
- 🔐 Inyección SQL
- 🔓 Credenciales hardcodeadas
- 🐛 Null pointer exceptions
- 🔒 Uso inseguro de criptografía
- 🚪 Path traversal vulnerabilities

### ¿Qué es SCA?

**SCA** (Software Composition Analysis) analiza las **dependencias de terceros** (librerías, frameworks) para detectar vulnerabilidades conocidas.

```
📦 package.json / requirements.txt → 🔍 SCA → ⚠️ Vulnerabilidades en dependencias
```

**Características:**
- ✅ Detecta **CVEs** (Common Vulnerabilities and Exposures)
- ✅ Monitorea **licencias** de librerías
- ✅ Rastrea **versiones desactualizadas**
- ✅ Automatizable en CI/CD

**Ejemplos:**
- Detectar `django==2.0` con vulnerabilidad XSS conocida
- Alertar sobre `lodash` con prototype pollution
- Identificar licencias incompatibles (GPL vs MIT)

### Diferencias SAST vs SCA

| Aspecto | SAST | SCA |
|---------|------|-----|
| **Analiza** | Tu código fuente | Dependencias de terceros |
| **Detecta** | Bugs, code smells, vulnerabilidades | CVEs, licencias, versiones |
| **Cuándo** | Durante desarrollo | Durante desarrollo + build |
| **Ejemplos** | SonarQube, Checkmarx | Snyk, Dependabot, OWASP Dependency-Check |

### 📊 Dimensiones de Calidad de Código

SonarQube evalúa código en 7 dimensiones:

1. **🐛 Bugs**: Errores que pueden causar comportamiento incorrecto
2. **🔒 Vulnerabilities**: Puntos débiles de seguridad
3. **🔥 Security Hotspots**: Código sensible que requiere revisión manual
4. **🧹 Code Smells**: Problemas de mantenibilidad (no bugs, pero mal código)
5. **✅ Coverage**: Porcentaje de código cubierto por tests
6. **📋 Duplications**: Código duplicado
7. **🏗️ Technical Debt**: Tiempo estimado para arreglar todos los issues

---

## 🔍 ¿Qué es SonarQube?

**SonarQube** es una plataforma de análisis continuo de calidad de código que:

- 📝 Analiza **múltiples lenguajes** (Python, TypeScript, JavaScript, Java, etc.)
- 🔍 Detecta **bugs, vulnerabilidades y code smells**
- 📊 Genera **métricas** de calidad
- 🎯 Define **Quality Gates** (pasa/no pasa)
- 📈 Rastrea **evolución** en el tiempo
- 🔄 Se integra con **CI/CD** (GitHub Actions, Jenkins, etc.)

### Componentes Principales

```
┌─────────────────────────────────────────────┐
│         SonarQube Platform                  │
├─────────────────────────────────────────────┤
│ 1. Scanner (Analiza el código)             │
│ 2. Server (Procesa y almacena resultados)  │
│ 3. Database (PostgreSQL)                    │
│ 4. Web UI (Visualización)                   │
└─────────────────────────────────────────────┘
```

---

## ☁️ SonarQube Cloud vs Self-Hosted

### SonarQube Cloud (SaaS)

**Pros:**
- ✅ **Sin infraestructura**: No necesitas servidores
- ✅ **Siempre actualizado**: Últimas features automáticamente
- ✅ **Fácil setup**: 5 minutos para empezar
- ✅ **Escalable**: SonarSource maneja la carga
- ✅ **Gratis para proyectos públicos**

**Contras:**
- ❌ **Datos en la nube**: Tu código se analiza en servidores de SonarSource
- ❌ **Menos customización**: No puedes instalar plugins custom
- ❌ **Costo para proyectos privados**: Planes de pago para repos privados

### SonarQube Self-Hosted (On-Premise)

**Pros:**
- ✅ **Control total**: Tus datos en tu infraestructura
- ✅ **Plugins custom**: Puedes extender funcionalidad
- ✅ **Sin límites de LOC**: En proyectos privados (con licencia)
- ✅ **Integración interna**: Con LDAP, SSO, etc.

**Contras:**
- ❌ **Requiere infraestructura**: Servidores, DB, mantenimiento
- ❌ **Actualizaciones manuales**: Tú gestionas upgrades
- ❌ **Costo inicial**: Licencias, servidores, DevOps
- ❌ **Complejidad**: Más difícil de configurar y mantener

### Comparación Rápida

| Característica | Cloud | Self-Hosted |
|----------------|-------|-------------|
| **Setup** | 5 min | Días/semanas |
| **Mantenimiento** | ☁️ SonarSource | 👨‍💻 Tu equipo |
| **Costo inicial** | $0 (público) | $$$$ |
| **Escalabilidad** | ♾️ Automática | 📈 Manual |
| **Datos** | ☁️ Nube | 🏢 On-premise |
| **Plugins** | ❌ Solo oficiales | ✅ Cualquiera |
| **Ideal para** | Proyectos públicos, startups | Empresas, datos sensibles |

---

## 💎 Plan Gratuito de SonarQube Cloud

### ✅ Lo que INCLUYE (Gratis)

Para **proyectos públicos en GitHub**:

- ✅ **Análisis ilimitado** de código
- ✅ **LOC ilimitadas** (Lines of Code)
- ✅ **Todos los lenguajes** soportados (28+)
- ✅ **Pull Request decoration** (comentarios en PRs)
- ✅ **Quality Gates**
- ✅ **Security Hotspots**
- ✅ **Métricas históricas**
- ✅ **Integración con GitHub Actions**
- ✅ **Múltiples ramas** (main, develop, features)
- ✅ **Usuarios ilimitados**
- ✅ **Proyectos públicos ilimitados**

### ❌ Lo que NO incluye (Requiere pago)

- ❌ **Proyectos privados** (necesitas plan Developer+)
- ❌ **Branch analysis avanzado** en privados
- ❌ **Portfolio management**
- ❌ **SLA garantizado**
- ❌ **Soporte prioritario**

### 💰 Planes de Pago (para privados)

| Plan | Precio | LOC | Ideal para |
|------|--------|-----|------------|
| **Free** | $0 | Ilimitado | Proyectos públicos |
| **Developer** | ~$10/mes | 100K LOC | Pequeños equipos |
| **Enterprise** | Custom | Ilimitado | Grandes empresas |

> 💡 **Tip**: Para proyectos open source o educativos, **siempre usa el repo público** para aprovechar el plan gratuito.

---

## ⚖️ Análisis Automático vs Workflows

### 🤖 Análisis Automático

SonarQube Cloud puede analizar **automáticamente** tu código cada vez que haces push (sin configurar nada).

**Cómo funciona:**
1. Conectas tu repo GitHub a SonarQube Cloud
2. Activas "Automatic Analysis"
3. Cada push → SonarQube analiza automáticamente

**Pros:**
- ✅ **Cero configuración** inicial
- ✅ **Funciona inmediatamente**
- ✅ **Sin archivos de config** en el repo
- ✅ **No consume minutos de GitHub Actions**

**Contras:**
- ❌ **Menos control**: No puedes customizar el análisis
- ❌ **Sin build steps**: No puede analizar código compilado
- ❌ **Sin coverage**: No puede procesar reportes de tests
- ❌ **Análisis básico**: Solo analiza archivos fuente directamente
- ❌ **No funciona bien con monorepos**: Difícil filtrar backend/frontend

### 🔧 Workflows de GitHub Actions

Configuras tu propio workflow de CI/CD para ejecutar el análisis.

**Cómo funciona:**
1. Creas `.github/workflows/sonarqube.yaml`
2. Defines cuándo y cómo analizar
3. Cada push/PR → GitHub Actions ejecuta SonarScanner

**Pros:**
- ✅ **Control total**: Customizas todo el proceso
- ✅ **Build steps**: Puedes compilar antes de analizar
- ✅ **Coverage reports**: Integras tests y coverage
- ✅ **Análisis condicional**: Solo en ciertas ramas o archivos
- ✅ **Multi-proyecto**: Puedes separar backend/frontend
- ✅ **Optimización**: Filtra lo que quieras analizar

**Contras:**
- ❌ **Requiere configuración**: Más setup inicial
- ❌ **Consume minutos de GitHub**: Usa tu cuota de Actions
- ❌ **Mantenimiento**: Tú actualizas versiones

### 📊 Comparación

| Aspecto | Automático | Workflow |
|---------|------------|----------|
| **Setup** | ⚡ Instantáneo | 🔧 15-30 min |
| **Control** | ❌ Limitado | ✅ Total |
| **Coverage** | ❌ No | ✅ Sí |
| **Build custom** | ❌ No | ✅ Sí |
| **Minutos GitHub** | 💰 $0 | 💰 Consume cuota |
| **Monorepo** | ❌ Difícil | ✅ Fácil |
| **Ideal para** | Proyectos simples | Proyectos complejos |

### 🎯 Recomendación

- **Usa Automático**: Para prototipos, proyectos simples, demos
- **Usa Workflow**: Para proyectos de producción, Django + frontend, con tests

---

## ⚙️ Configuración en Multiomix

Multiomix usa **dos estrategias** en paralelo:

### 1️⃣ Análisis Automático (Activado en SonarCloud)

- Se ejecuta automáticamente en cada push
- Analiza todo el repositorio
- No requiere configuración local

### 2️⃣ Workflows de GitHub Actions (3 workflows)

#### **Workflow 1: SonarQube Analysis** (`sonarqube.yaml`)

```yaml
name: SonarQube Analysis
on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:
    types: [opened, synchronize, reopened]
```

**Qué hace:**
- Analiza **todo el proyecto** (backend + frontend)
- Ejecuta linter y type checks de frontend
- Sube resultados a SonarQube Cloud

**Proyecto en SonarQube:**
- `omics-datascience_multiomix` (proyecto único)

#### **Workflow 2: SonarQube Report Generator** (`sonarqube-report.yaml`)

```yaml
name: SonarQube Report Generator
on:
  workflow_dispatch:  # Manual
  schedule:
    - cron: '0 9 * * 1'  # Lunes 9 AM
```

**Qué hace:**
- Genera reportes semanales automáticos
- Consulta API de SonarQube
- Crea informe en Markdown
- Guarda como artifact descargable
- (Opcional) Envía a Slack/Email/GitHub Issues

### 📁 Archivos de Configuración

#### `sonar-project.properties` (raíz)

```properties
sonar.projectKey=omics-datascience_multiomix
sonar.organization=omics-datascience
sonar.projectName=multiomix
sonar.projectVersion=1.0

# Sources - scan everything in src/
sonar.sources=src

# Exclude only node_modules, migrations and build artifacts
sonar.exclusions=**/node_modules/**,**/migrations/**,**/__pycache__/**,**/venv/**,**/.venv/**,**/htmlcov/**,**/staticfiles/**,**/*.pyc,**/email/**,**/dist/**

# Python settings
sonar.python.version=3.12
sonar.sourceEncoding=UTF-8

# JavaScript/TypeScript settings
sonar.javascript.node.maxspace=4096
```

**Explicación:**
- `sonar.sources=src`: Analiza todo dentro de `src/`
- `sonar.exclusions`: Ignora código generado, dependencias, tests
- **No usa `sonar.inclusions`**: Deja que SonarQube detecte automáticamente Python/TypeScript/JavaScript

### 🔑 Secrets de GitHub

Necesitas configurar en GitHub Settings → Secrets:

- `SONAR_TOKEN`: Token de autenticación de SonarQube Cloud

**Cómo obtener el token:**
1. Ve a SonarQube Cloud → My Account → Security
2. Generate Token
3. Copia y pégalo en GitHub Secrets

---

## 🧭 Navegando SonarQube Cloud

### 📊 Dashboard Principal

Al abrir tu proyecto verás:

```
┌──────────────────────────────────────────────────┐
│  Multiomix                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  Quality Gate: ✅ Passed                        │
│                                                  │
│  🐛 Bugs              6                          │
│  🔒 Vulnerabilities   0                          │
│  🔥 Security Hotspots 10                         │
│  🧹 Code Smells       804                        │
│  ✅ Coverage          15%                        │
│  📋 Duplications      2.3%                       │
│  📏 Lines of Code     42,955                     │
└──────────────────────────────────────────────────┘
```

### 🐛 Issues (Problemas)

**Qué son:**
- Bugs, vulnerabilities y code smells detectados en tu código

**Tipos de Issues:**

1. **🐛 Bug**: Error de lógica que causará comportamiento incorrecto
   ```python
   # Ejemplo: Null pointer
   user = None
   print(user.name)  # ← Bug: AttributeError
   ```

2. **🔒 Vulnerability**: Problema de seguridad
   ```python
   # Ejemplo: SQL Injection
   query = f"SELECT * FROM users WHERE id = {user_input}"  # ← Vulnerable
   ```

3. **🧹 Code Smell**: No es un bug, pero dificulta mantenibilidad
   ```python
   # Ejemplo: Función muy larga (200 líneas)
   # Ejemplo: Complejidad ciclomática alta
   # Ejemplo: Código duplicado
   ```

**Severidades:**
- 🔴 **Blocker**: Debe arreglarse YA
- 🟠 **Critical**: Arreglar pronto
- 🟡 **Major**: Arreglar
- 🔵 **Minor**: Nice to have
- ⚪ **Info**: FYI

**Cómo navegar Issues:**
1. Click en "Issues" en el menú
2. Filtra por:
   - **Type**: Bug / Vulnerability / Code Smell
   - **Severity**: Blocker, Critical, etc.
   - **Language**: Python, TypeScript, JavaScript
   - **Directory**: Filtra backend (`src/api_service/`) o frontend (`src/frontend/`)
   - **Status**: Open, Confirmed, Resolved, False Positive
3. Click en un issue para ver:
   - Descripción del problema
   - Snippet de código
   - Sugerencia de solución
   - Regla que lo detectó

### 🔥 Security Hotspots

**Qué son:**
- Código "sensible" de seguridad que **requiere revisión manual**
- No son vulnerabilidades confirmadas, sino **puntos a revisar**

**Ejemplos:**
```python
# Hotspot: Uso de random (no criptográfico)
import random
token = random.randint(1000, 9999)  # ← ¿Es para seguridad?

# Hotspot: Cookies sin flags seguros
response.set_cookie('session', value)  # ← ¿Tiene HttpOnly? ¿Secure?

# Hotspot: Logging de datos sensibles
logger.info(f"User password: {password}")  # ← ¿Debería logearse?
```

**Cómo revisar:**
1. Ve a "Security Hotspots"
2. Para cada hotspot:
   - **Review**: Lee el código
   - Decide si es seguro o no
   - Marca como:
     - ✅ **Safe**: Revisado, no hay problema
     - ❌ **Vulnerability**: Confirma como vulnerabilidad real
     - 🔄 **Fixed**: Ya lo arreglaste

### 📏 Measures (Métricas)

**Métricas principales:**

- **📊 Lines of Code (LOC)**: Líneas de código (sin comentarios ni líneas vacías)
- **🏗️ Technical Debt**: Tiempo estimado para arreglar todos los issues
- **📋 Duplications**: Porcentaje de código duplicado
- **🔁 Complexity**: Complejidad ciclomática (cuántos paths tiene el código)
- **✅ Coverage**: Cobertura de tests
- **🔒 Security Rating**: A (mejor) → E (peor)
- **🐛 Reliability Rating**: A → E

**Cómo ver métricas:**
1. Click en "Measures"
2. Explora categorías:
   - **Reliability**: Bugs
   - **Security**: Vulnerabilities, Hotspots
   - **Maintainability**: Code Smells, Technical Debt
   - **Coverage**: Test coverage
   - **Duplications**: Código duplicado
   - **Size**: LOC, archivos, clases, funciones

### 📂 Code (Vista de árbol)

Navega tu código en estructura de directorios:

```
multiomix/
└── src/
    ├── api_service/          [2,500 LOC] [3 bugs] [45 code smells]
    ├── biomarkers/           [800 LOC]   [1 bug]  [12 code smells]
    ├── frontend/             [5,200 LOC] [2 bugs] [38 code smells]
    │   └── static/
    │       └── frontend/
    │           └── src/
    ├── genes/                [450 LOC]   [0 bugs] [8 code smells]
    └── ...
```

**Cómo usar:**
1. Click en "Code"
2. Navega por directorios
3. Para cada directorio ves:
   - 📏 Lines of Code
   - 🐛 Bugs
   - 🔒 Vulnerabilities
   - 🧹 Code Smells
   - 📋 Duplications
   - ✅ Coverage
4. Click en un archivo para ver issues específicos en ese archivo

### 📈 Activity (Historial)

Ve la evolución de tu proyecto en el tiempo:

- 📊 Gráficos de métricas (bugs, code smells, coverage)
- 📅 Análisis históricos
- 🔄 Comparación entre análisis
- 📝 Eventos (nuevos issues, issues resueltos)

**Ideal para:**
- Ver si la calidad está mejorando o empeorando
- Tracking de Technical Debt
- Demostrar mejoras al equipo

---

## 🎯 Filtrando entre Frontend y Backend

### Método 1: Filtro por Lenguaje

**En Issues/Code/Measures:**
1. Click en el filtro **"Language"**
2. Selecciona:
   - **Python** → Backend (Django apps)
   - **TypeScript** → Frontend
   - **JavaScript** → Frontend

### Método 2: Filtro por Directorio

**En Code tab:**
1. Navega a:
   - `src/api_service/`, `src/biomarkers/`, etc. → Backend
   - `src/frontend/static/frontend/src/` → Frontend

**En Issues tab:**
1. Usa el filtro **"Directory"**
2. Escribe:
   - `src/api_service` → Solo backend API
   - `src/frontend` → Solo frontend

### Método 3: Usar la búsqueda

En la barra de búsqueda de Issues:
```
# Solo backend Python
language:python

# Solo frontend TypeScript
language:ts

# Solo un app específico
directory:src/api_service

# Combinar filtros
language:python AND severity:BLOCKER
```

### Método 4: Bookmarks personalizados

1. Aplica los filtros que quieras
2. La URL cambiará, por ejemplo:
   ```
   https://sonarcloud.io/project/issues?id=omics-datascience_multiomix&language=py
   ```
3. Guarda esa URL como bookmark:
   - "Multiomix - Backend Issues"
   - "Multiomix - Frontend Issues"

---

## 🚪 Quality Gates

### ¿Qué son?

Un **Quality Gate** es un conjunto de **condiciones** que tu código debe cumplir para considerarse "aceptable".

```
Quality Gate = Conjunto de reglas de "pasa/no pasa"
```

**Ejemplo:**
```
Quality Gate "Sonar way":
✅ Coverage ≥ 80%
✅ Duplications ≤ 3%
✅ Vulnerabilities = 0
✅ Bugs nuevos = 0
✅ Security Hotspots revisados = 100%
```

### Estados del Quality Gate

- ✅ **Passed**: Tu código cumple todas las condiciones
- ❌ **Failed**: Al menos una condición no se cumple
- ⚠️ **Warning**: Algunas métricas cerca del límite

### Quality Gate por defecto: "Sonar way"

SonarQube Cloud incluye un Quality Gate llamado **"Sonar way"** con estas condiciones:

#### En código nuevo (New Code):
- ✅ Coverage ≥ 80%
- ✅ Duplications ≤ 3%
- ✅ Maintainability Rating ≥ A
- ✅ Reliability Rating ≥ A
- ✅ Security Rating ≥ A
- ✅ Security Hotspots revisados = 100%

#### En código total (Overall):
- ✅ Sin condiciones estrictas (solo se enfoca en código nuevo)

### ¿Por qué "New Code"?

SonarQube se enfoca en **no empeorar** la calidad:

- 🚫 No exige que arregles código legacy de golpe
- ✅ Exige que código **nuevo** sea de calidad
- 📈 Gradualmente mejoras todo el proyecto

### Configurar Quality Gates

**En SonarQube Cloud:**
1. Ve a "Quality Gates"
2. Crea un nuevo Quality Gate o edita "Sonar way"
3. Agrega condiciones:
   - Selecciona métrica (Coverage, Bugs, etc.)
   - Selecciona si aplica a "Overall Code" o "New Code"
   - Define el threshold (umbral)
   - Guarda

**Ejemplo: Quality Gate custom para Multiomix**
```
Nombre: "Multiomix Standard"

Condiciones:
- Coverage en nuevo código ≥ 60% (más realista que 80%)
- Bugs nuevos = 0
- Vulnerabilities nuevas = 0
- Code Smells nuevos ≤ 5
- Security Hotspots revisados = 100%
- Duplications nuevas ≤ 3%
```

### Integración con GitHub

Si tu Quality Gate **falla**:
- ❌ El PR en GitHub se marcará como "check failed"
- 🚫 Puedes bloquear el merge (configurando branch protection)
- 📝 Ves detalles del fallo en el PR

---

## 🎨 Quality Profiles

### ¿Qué son?

Un **Quality Profile** es un **conjunto de reglas** (rules) activas para un lenguaje.

```
Quality Profile = Colección de reglas para analizar código
```

**Ejemplo:**
```
Quality Profile "Sonar way (Python)":
- ✅ 250 reglas activas
- Detecta bugs, vulnerabilities, code smells
- Severidades configuradas
```

### Profiles por lenguaje

Cada lenguaje tiene su propio Quality Profile:
- **Python**: Sonar way (Python)
- **TypeScript**: Sonar way (TypeScript)
- **JavaScript**: Sonar way (JavaScript)

### Quality Profile por defecto: "Sonar way"

SonarQube incluye profiles por defecto llamados **"Sonar way"** para cada lenguaje.

**Características:**
- ✅ Mantenido por SonarSource (expertos)
- ✅ Actualizado regularmente
- ✅ Balance entre rigor y practicidad
- ✅ Basado en mejores prácticas de la industria

### Crear Quality Profile custom

**Ejemplo: Multiomix Custom Python Profile**

1. Ve a "Quality Profiles" en SonarQube Cloud
2. Selecciona "Python" → "Sonar way"
3. Click "Copy" → Nombre: "Multiomix Python"
4. Activa/desactiva reglas:
   - ✅ Activa: "Functions should not be too complex" (max complexity: 10)
   - ✅ Activa: "Too many parameters" (max: 5)
   - ❌ Desactiva: Reglas que generen ruido para tu proyecto
5. Ajusta severidades:
   - Cambia "Code smell" → "Bug" para reglas críticas
6. Asigna el profile a tu proyecto

### Herencia de Profiles

Puedes crear **jerarquías**:

```
Sonar way (Python)
    ↓ (hereda)
Company Standard (Python)
    ↓ (hereda)
Multiomix Python
```

**Ventaja**: Cambios en el profile padre se propagan a los hijos.

---

## 📋 Rules (Reglas)

### ¿Qué son?

Una **Rule** es una **regla específica** que SonarQube verifica en tu código.

**Ejemplo de regla:**
```
Rule: "S1134" - Track uses of "FIXME" tags
Tipo: Code Smell
Severidad: Major
Descripción: "FIXME" comments should be handled

# Detecta:
# FIXME: This is a quick hack  ← SonarQube lo detectará
```

### Tipos de Rules

1. **🐛 Bug**: Detecta errores de lógica
   - Ejemplo: "Null pointer dereference"
   - Ejemplo: "Incorrect use of equals()"

2. **🔒 Vulnerability**: Detecta problemas de seguridad
   - Ejemplo: "SQL injection"
   - Ejemplo: "Hardcoded credentials"

3. **🧹 Code Smell**: Detecta problemas de mantenibilidad
   - Ejemplo: "Functions too long"
   - Ejemplo: "Cognitive complexity too high"

4. **🔥 Security Hotspot**: Marca código sensible para revisión
   - Ejemplo: "Using pseudorandom number generators"
   - Ejemplo: "Cookies should be secure"

### Anatomía de una Rule

Cada regla tiene:

- **ID**: Identificador único (ej: `S1134`, `S2068`)
- **Name**: Nombre descriptivo
- **Type**: Bug / Vulnerability / Code Smell / Security Hotspot
- **Severity**: Blocker / Critical / Major / Minor / Info
- **Description**: Explicación detallada del problema
- **Non-compliant code example**: Ejemplo de código malo
- **Compliant solution**: Ejemplo de código correcto
- **Tags**: Categorización (security, performance, confusing, etc.)

### Ejemplo de Rule: S2068 - Hardcoded credentials

**Descripción:**
```
Credentials should not be hard-coded

Hard-coding credentials in source code is a security risk.
Anyone with access to the code can steal the credentials.
```

**Non-compliant:**
```python
password = "MyP@ssw0rd"  # ← Detectado por S2068
db.connect(user="admin", password="admin123")
```

**Compliant:**
```python
import os
password = os.environ.get("DB_PASSWORD")
db.connect(user="admin", password=password)
```

**Severidad**: Critical
**Tipo**: Vulnerability

### Explorar Rules

**En SonarQube Cloud:**
1. Ve a "Rules" en el menú
2. Filtra por:
   - **Language**: Python, TypeScript, JavaScript
   - **Type**: Bug, Vulnerability, Code Smell
   - **Severity**: Blocker, Critical, etc.
   - **Tag**: security, performance, django, etc.
   - **Status**: Active, Deprecated
3. Click en una rule para ver descripción completa

**Reglas populares para Django (Python):**
- `S3649`: Database queries should not be vulnerable to injection
- `S2068`: Credentials should not be hard-coded
- `S5144`: Server-side requests should not be vulnerable to forging attacks (SSRF)
- `S5131`: Endpoints should not be vulnerable to XSS

**Reglas populares para TypeScript/React:**
- `S1186`: Functions should not be empty
- `S6268`: React components should not render non-boolean conditions
- `S6299`: React components should use JSX syntax
- `typescript:S1128`: Unused imports should be removed

### Activar/Desactivar Rules

**En el Quality Profile:**
1. Ve a "Quality Profiles"
2. Selecciona tu profile (ej: "Multiomix Python")
3. Click "Activate More"
4. Busca rules y actívalas/desactívalas

**Desde un Issue:**
1. Ve a un issue específico
2. Click en la regla (ej: "S1134")
3. Click "Deactivate" (si no quieres esa regla)

### Marcas False Positive / Won't Fix

Si una regla detecta algo que **no es un problema real**:

1. Ve al issue
2. Click "..." → "Change Status"
3. Selecciona:
   - **False Positive**: La regla se equivocó
   - **Won't Fix**: Es real, pero decides no arreglarlo
4. Agrega un comentario explicando por qué
5. El issue desaparece de las métricas

---

## 🏆 Mejores Prácticas

### Para Desarrolladores

1. **🔍 Revisa SonarQube antes de abrir PR**
   - Ve a SonarQube Cloud
   - Mira los issues en tu rama
   - Arregla al menos los Blockers y Criticals

2. **✅ Haz que el Quality Gate pase**
   - Si falla, revisa qué condición no se cumple
   - Arregla antes de mergear

3. **🔥 Revisa Security Hotspots**
   - No los ignores
   - Evalúa si son seguros o no
   - Márcalos como Safe o Vulnerability

4. **📝 No desactives reglas sin razón**
   - Si una regla molesta, discútelo con el equipo
   - Documenta por qué la desactivas

5. **🧪 Escribe tests**
   - Coverage no lo es todo, pero ayuda
   - Usa pytest para backend, Jest para frontend

### Para el Equipo

1. **📊 Revisen métricas en retrospectivas**
   - ¿Technical Debt está creciendo?
   - ¿Coverage está bajando?
   - ¿Más bugs en código nuevo?

2. **🎯 Definan Quality Gates realistas**
   - No exijan 100% coverage de golpe
   - Suban el estándar gradualmente

3. **🔄 Actualicen Quality Profiles**
   - Revisen reglas nuevas cada trimestre
   - Activen reglas que agreguen valor

4. **📚 Eduquen sobre reglas**
   - Compartan reglas importantes en el equipo
   - Hagan code reviews enfocados en calidad

5. **🚀 Celebren mejoras**
   - Si suben coverage de 10% → 30%, celebren
   - Reconozcan a quien arregla Technical Debt

### Para DevOps/Tech Leads

1. **🔒 Bloqueen merges si Quality Gate falla**
   ```yaml
   # En GitHub branch protection rules
   Require status checks to pass:
   ✅ SonarQube Analysis
   ```

2. **📧 Configuren notificaciones**
   - Slack cuando Quality Gate falla
   - Email con reporte semanal

3. **📈 Tracen tendencias**
   - Usen el workflow de reportes
   - Compartan con stakeholders

4. **🎓 Den training al equipo**
   - Sesión sobre SonarQube
   - Demo de cómo leer issues

---

## 🔗 Enlaces Útiles

- 📚 [SonarQube Docs](https://docs.sonarqube.org/)
- ☁️ [SonarCloud Docs](https://docs.sonarcloud.io/)
- 🐍 [Python Rules](https://rules.sonarsource.com/python/)
- 🟦 [TypeScript Rules](https://rules.sonarsource.com/typescript/)
- 🟨 [JavaScript Rules](https://rules.sonarsource.com/javascript/)
- 🔧 [GitHub Actions Integration](https://github.com/SonarSource/sonarqube-scan-action)

---

## 📞 Soporte

Si tienes dudas sobre SonarQube en Multiomix:
- 💬 Pregunta en el canal de Slack del equipo
- 📧 Contacta al tech lead
- 📝 Abre un issue en GitHub con la etiqueta `sonarqube`

---

**Última actualización**: Noviembre 2025
**Mantenido por**: Equipo de Multiomix
