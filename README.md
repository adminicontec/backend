# Campus Virtual Backend - Node.js Framework

## Requisitos del Sistema

### Software Requerido

Antes de comenzar, asegúrate de tener instalado el siguiente software en tu máquina local:

#### 1. Node.js (Versión Específica Requerida)
- **Node.js versión 12.22.12** (EXACTA)
- Descargar desde: https://nodejs.org/download/release/v12.22.12/
- Verificar instalación: `node --version` (debe mostrar v12.22.12)

#### 2. NPM
- **NPM versión 6.14.16 o superior** (incluido con Node.js 12.22.12)
- Verificar instalación: `npm --version`

#### 3. Git
- **Git** para control de versiones
- Documentación oficial: https://git-scm.com/
- Verificar instalación: `git --version`

#### 4. TypeScript y herramientas globales
Instalar las siguientes herramientas de forma global:

```bash
# Instalar TypeScript y ts-node globalmente
npm install -g typescript ts-node

# Instalar tipos de Node.js globalmente
npm install -g @types/node
```

Verificar instalaciones:
```bash
tsc --version
ts-node --version
```

## Instalación y Configuración del Proyecto

### Paso 1: Clonar el Repositorio

```bash
# Clonar desde Azure DevOps
git clone https://fdevias@dev.azure.com/fdevias/Campusvirtual_icontec/_git/backend

# Navegar al directorio del proyecto
cd backend
```

### Paso 2: Instalar Dependencias del Proyecto

```bash
# Instalar todas las dependencias
npm install
```

### Paso 3: Inicializar el Proyecto

```bash
# Ejecutar script de inicialización
npm run init
```

### Paso 4: Configurar el Archivo de Entorno

#### Crear el archivo de configuración:
```bash
# Crear directorio de configuración si no existe
mkdir -p ./src/config

# Crear archivo de configuración de desarrollo
touch ./src/config/env.json
```

#### Configurar el archivo `env.json`:
Abrir el archivo `./src/config/env.json` y agregar la configuración básica:

```json
{
  "environment": "dev",
  "host": "http://127.0.0.1:3015",
  "server_port": 3015,
  "use_ssl": false,
  "default_language": "es"
}
```

### Paso 5: Instalar y Configurar el Cliente CLI

```bash
# Instalar el cliente desde el repositorio de Azure DevOps
git clone https://fdevias@dev.azure.com/fdevias/Campusvirtual_icontec/_git/cliente scnode-cli
cd scnode-cli
npm install
npm link
```

### Paso 6: Deploy Inicial

```bash
# Hacer el deploy inicial para desarrollo
scnode_cli --deploy dev
```

## Lanzamiento del Proyecto

### Modo Desarrollo

1. **Deploy de desarrollo** (ejecutar cada vez que se modifique la configuración):
   ```bash
   scnode_cli --deploy dev
   ```

2. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

3. **Acceso al servidor**:
   - URL: http://127.0.0.1:3015 (o el puerto configurado en env.json)

**Nota importante**: Siempre que se actualice un archivo de internacionalización o vista será necesario reiniciar los servicios.

### Modo Producción

1. **Crear archivo de configuración de producción**:
   ```bash
   touch ./src/config/env.prod.json
   ```

2. **Configurar variables de producción** en `env.prod.json`:
   ```json
   {
     "environment": "prod",
     "host": "https://tu-dominio-produccion.com",
     "server_port": 80,
     "use_ssl": true,
     "default_language": "es"
   }
   ```

3. **Deploy de producción**:
   ```bash
   scnode_cli --deploy prod --dist ./dist
   ```

4. **Cambiar al directorio de distribución**:
   ```bash
   cd ./dist
   ```

5. **Iniciar el servidor de producción**:
   ```bash
   npm run start
   ```

## Verificación de la Instalación

Para verificar que todo está funcionando correctamente:

```bash
# Verificar versión de Node.js
node --version  # Debe mostrar: v12.22.12

# Verificar que las dependencias están instaladas
npm list --depth=0

# Verificar que el CLI está disponible
scnode_cli --help

# Probar el servidor en desarrollo
npm run dev
```

## Solución de Problemas

### Error de versión de Node.js
Si tienes una versión diferente de Node.js instalada:
- Usa un gestor de versiones como `nvm` (macOS/Linux) o `nvm-windows`
- Instala y usa la versión específica:
  ```bash
  nvm install 12.22.12
  nvm use 12.22.12
  ```

### Errores de permisos en npm
```bash
# Configurar npm para evitar sudo
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Error al clonar el repositorio
- Verificar credenciales de Azure DevOps
- Asegurar acceso al repositorio: https://fdevias@dev.azure.com/fdevias/Campusvirtual_icontec/_git/cliente

---

## Configuración Avanzada

### Parámetros de Configuración del Archivo `env.json`

La configuración completa del archivo `env.json` admite los siguientes parámetros:

```json
{
  "environment": "dev|prod",
  "host": "string", // EJ: http://127.0.0.1:3015
  "use_ssl": boolean, // Servidor con SSL. (true | false)
  "default_language": "string", // Idioma por defecto del sistema (es | en)
  "server_port": integer, // EJ: 3015
  "jwt_secret": {
    "local": "string" // Llave secreta para encriptar los tokens JWT
  },
  "jwt_exp": {
    "amount": integer, // Tiempo de duración del token JWT
    "unity": "days|hours" // Unidad de tiempo del token JWT
  },
  "attached": {
    "driver": "server",
    "server": {
      "base_path": "string" // EJ: uploads
    }
  },
  "external_api": { // Endpoints externos
    "example_key": { // Configuración de endpoint externo
      "url": "string" // URL del endpoint (Ej: http://example.api.com)
    }
  },
  "main_external_api": "string", // Endpoint por defecto (Ej: example_key) 
  "customs": {}, // Listado de parámetros customizados disponibles globalmente
  "socket": boolean, // Habilita/deshabilita la conexión socket
  "i18n_config": { // Configuración de la internacionalización
    "debug": boolean // Habilita/deshabilita el modo de depuración
  },
  "router_prefix": "string", // Prefijo de acceso a los endpoint (Ej. api)
  "database": { // Configuración de la base de datos
    "driver": "mysql|mongodb", // Tipo de servicio de BD
    "mongodb": { // Configuración de MongoDb
      "host": "string", // Cadena de conexión a mongo (Ej: localhost:27017)
      "dbname": "string" // Nombre de la base de datos
    },
    "mysql": { // Configuración de MySql
      "database": "string", // Nombre de la base de datos
      "host": "string",
      "username": "string",
      "password": "string|null",
      "dialect": "mysql"
    }
  }
}
```

### Ejemplo de Configuración Completa para Desarrollo

```json
{
  "environment": "dev",
  "host": "http://127.0.0.1:3015",
  "use_ssl": false,
  "default_language": "es",
  "server_port": 3015,
  "jwt_secret": {
    "local": "mi-secreto-jwt-desarrollo-2023"
  },
  "jwt_exp": {
    "amount": 7,
    "unity": "days"
  },
  "attached": {
    "driver": "server",
    "server": {
      "base_path": "uploads"
    }
  },
  "socket": true,
  "i18n_config": {
    "debug": true
  },
  "router_prefix": "api",
  "database": {
    "driver": "mysql",
    "mysql": {
      "database": "campus_virtual_dev",
      "host": "localhost",
      "username": "root",
      "password": null,
      "dialect": "mysql"
    }
  }
}
```

## Información del Repositorio

- **Repositorio Principal**: https://fdevias@dev.azure.com/fdevias/Campusvirtual_icontec/_git/cliente
- **Versión de Node.js Requerida**: 12.22.12
- **Plataforma**: Azure DevOps
- **Framework**: Scaffolding Node.js con TypeScript

### Parametros de configuración del archivo ``env.json``

```
{
  "environment": "dev|prod",
  "host": "string", // EJ: http://127.0.0.1:3015
  "use_ssl": boolean, // Servidor con SSL. (true | false)
  "default_language": "string", // Idioma por defecto del sistema (es | en)
  "server_port": integer, // EJ: 3015
  "jwt_secret": {
    "local": "string" // Llave secreta para encriptar los tokens JWT
  },
  "jwt_exp": {
    "amount": integer // Tiempo de duración del token JWT
    "unity": "days|hours" // Tiempo de duración del token JWT
  },
  "attached": {
    "driver": "server",
    "server": {
      "base_path": "string" // EJ: uploads
    }
  },
  "external_api": { // Endpoints externos
    "example_key": { // Configuración de endpoint externo
      "url": "string" // URL del endpoint (Ej: http://example.api.com)
    }
  },
  "main_external_api": "string", // Endpoint por defecto (Ej: example_key) 
  "customs": {}, // Listado de parametros customizados que estaran disponibles de forma global
  "socket": boolean, // Habilita/deshabilita la conexión socket
  "i18n_config": { // Configuración de la internacionalización
    "debug": boolean // Habilita/deshabilita el modo de depuración
  },
  "router_prefix": "string", // Prefijo de acceso a los endpoint (Ej. api)
  "database": { // Configuración de la base de datos
    "driver": "mysql|mongodb", // Tipo de servicio de BD
    "mongodb": { // Configuración de MongoDb
      "host": "string", // Cadena de conexión a mongo (Ej: localhost:27017)
      "dbname": "string" // Nombre de la base de datos
    },
    "mysql": { // Configuración de MySql
      "database": "string", // Nombre de la base de datos
      "host": "string",
      "username": "string",
      "password": string|null,
      "dialect": "mysql"
    }
  },
}
```
