# Scaffolding Nodejs

## Dependencias

Para la implementación de este framework se requiere tener instalado en la máquina local los siguientes paquetes de software:

- **Git**: La documuentación oficial se puede encontrar acá https://git-scm.com/

- **NodeJS**: Se recomienda trabajar con la versión 10.15.3 o superior https://nodejs.org/es/

- **NPM**: Se recomienda trabajar con la versión 6.4.1 o superior

- **TypeScript y TypeScript Node**:

```
$ npm install -g typescript ts-node
```

- **Types node**:

```
$ npm install -g @types/node
```

## Instalación y configuración

- Clonar el repositorio en el entorno local
- Instalación de las dependencias con el comando ``npm i``
- Iniciar el proyecto ``npm run init``
- Instalación del cliente ``https://github.com/Kodria/scnode-cli``
- Agregar archivo de configuración ``env.json``
  ```
  touch ./src/config/env.json
  ```
- Inicializar el archivo de configuración ``env.json``
  ```
  {
    "environment": "dev"
  }
  ```
- Hacer el deploy del proyecto para inicializar ``scnode_cli --deploy dev``

## Lanzamiento del proyecto - Desarrollo

- Hacer el deploy del proyecto para inicializar ``scnode_cli --deploy dev``

- Para lanzar el proyecto en modo desarrollo
  ```
  npm run dev
  ```
- Siempre que se actualice un archivo de internacionalización o vista será necesario reiniciar los servicios

## Lanzamiento del proyecto - Producción

- Generar las variables de configuración del entorno
  ```
  touch ./src/config/env.prod.json
  ```
- Configurar las variables según la necesidad

- Hacer el deploy del proyecto para inicializar ``scnode_cli --deploy prod --dist <custom_path>``

- Posicionarse en la nueva carpeta de distribución

- Para lanzar el proyecto en modo produccion
  ```
  npm run start
  ```

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

