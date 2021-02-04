// @import_dependencies_node Import libraries
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import notifier from 'node-notifier';
import 'module-alias/register';
// @end

// @import utilities
import {socketUtility} from "@scnode_core/utilities/socketUtility";
// @end

// @import_config_files Import config files
import { use_ssl, server_port, socket } from "@scnode_core/config/globals";
// @end

// @init_app
import app from "@scnode_app/app";
// @end

let server;

// @init_server
if (typeof use_ssl === 'object' && Object.keys(use_ssl).length > 0) { // Utilizando credenciales HTTPS para produccion

  let options = {
    key: null,
    cert: null,
    ca: null
  };

  if (!use_ssl.hasOwnProperty('sslKey') || !fs.existsSync(use_ssl['sslKey'])) {
    console.log('sslKey:\t ' + use_ssl['sslKey'] + ' does not exist.');
    process.exit(1)
  } else {
    options.key = fs.readFileSync(use_ssl['sslKey']);
  }

  if (!use_ssl.hasOwnProperty('sslCert') || !fs.existsSync(use_ssl['sslCert'])) {
    console.log('sslCert:\t ' + use_ssl['sslCert'] + ' does not exist.');
    process.exit(1)
  } else {
    options.cert = fs.readFileSync(use_ssl['sslCert']);
  }

  if (use_ssl.hasOwnProperty('sslCabundle')) {
    if (!fs.existsSync(use_ssl['sslCabundle'])) {
      console.log('sslCabundle:\t ' + use_ssl['sslCabundle'] + ' does not exist.');
      process.exit(1)
    }

    options.ca = fs.readFileSync(use_ssl['sslCabundle']);
  }
  server = https.createServer(options, app);

} else { // Apertura del servidor sin credenciales
  server = new http.Server(app);
}

if (server) {

  server.listen(server_port, () => {
    console.log('Express server listening on port ' + server_port);
    notifier.notify({
      title: 'Nodejs Server',
      message: 'Servidor iniciado'
    });
  })

  if (socket) socketUtility.connect(server); // Inicializando socket
}
// @end
