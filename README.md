# Scaffolding Nodejs


## Instalación y configuración

- Clonar el repositorio en el entorno local
- Instalación de las dependencias con el comando ``npm i``
- Instalación del cliente ``https://github.com/Kodria/scnode-cli``
- Agregar archivo de configuración ``env.json``
  ```
  touch ./src/config/env.json
  ```
- Inicializar el archivo de configuración ``env.json```
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
  "server_port": integer,
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
  }
}
