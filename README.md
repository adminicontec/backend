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
## Lanzamiento del proyecto

- Para lanzar el proyecto en modo desarrollo
  ```
  npm run dev
  ```
- Para lanzar el proyecto en modo produccion
  ```
  npm run start
  ```


### Parametros de configuración del archivo ``env.json``

```
{
  "environment": "dev|prod",
  "host": "string", // EJ: http://127.0.0.1:3015
  "server_port": integer, // EJ: 3015
  "attached": {
    "driver": "server",
    "server": {
      "base_path": "string" // EJ: uploads
    }
  },
  "database": {
      "driver": "mysql|mongodb",
      "mongodb": {
        "host": "",
        "dbname": ""
      },
      "mysql": {
        "database": "string",
        "host": "string",
        "username": "string",
        "password": string|null,
        "dialect": "mysql"
      }
  },
  "external_api": { // Listado de endpoints que pueden ser conectados
    "example": {
      "url": "http://exampleapi.com"
    },
    "pokemon": {
      "url": "https://pokeapi.co/api/v2"
    }
  }
  "main_external_api": "string" // Ej: pokemon
}
```
