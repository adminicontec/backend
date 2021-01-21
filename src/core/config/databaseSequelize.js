// @import_config_files Import config files
const env = require('../../config/env.json');
// @end

// @init_vars
const driver          = (env.hasOwnProperty('database') && env['database'].hasOwnProperty('driver')) ? env['database']['driver'] : null;
const connection_data = (driver && env['database'].hasOwnProperty(driver)) ? env['database'][driver] : {};
// @end

module.exports = {
  development: connection_data,
  test       : connection_data,
  production : connection_data
};
