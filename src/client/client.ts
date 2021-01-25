#!/usr/bin/env ts-node -r tsconfig-paths/register
const argv = require('minimist')(process.argv.slice(2));

// @import config
import {orm} from '@scnode_core/config/globals'
// @end

// @import utilities
import {consoleUtility} from '@scnode_core/utilities/consoleUtility'
import {i18nUtility} from '@scnode_core/utilities/i18nUtility'
// @end

// @import services
import {runSeederService} from '@scnode_core/services/default/plugins/seeder/runSeederService'
// @end

class Client {
  public run = async() => {
    i18nUtility.initConfigI18n();
    await orm.initConfigDb();

    consoleUtility.createBanner('CLI')

    switch (argv['program']) {
      case 'seeder':
        await runSeederService.init(argv)
        break;
      default:
        consoleUtility.showErrorConsole(`El programa no es valido`)
        process.exit(1)
        break;
    }
  }
}
const _client = new Client();
_client.run();
