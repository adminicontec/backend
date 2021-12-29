const ObjectID = require('mongodb').ObjectID

// @import_services Import Services
import { DefaultPluginsSeederSeederService } from "@scnode_core/services/default/plugins/seeder/seederService";
// @end

// @import_models Import models
import { CourseScheduling } from "@scnode_app/models";
// @end

// @import_utilitites Import utilities
// @end

class UpdateClientCourseSchedulingSeeder extends DefaultPluginsSeederSeederService {

  /**
   * Metodo que contiene la logica del seeder
   * @return Booleano que identifica si se pudo o no ejecutar el Seeder
   */
  public run = async () => {
    // @seeder_logic Add seeder logic
    // @end

    try {
      const response: any = await CourseScheduling.updateMany({client: {$exists: true}}, {$unset: {client: 1}}, {
        useFindAndModify: false,
        new: true,
        lean: true,
      });
      console.log('updateClientCourseScheduling::response', response)
      return true
    } catch (e) {
      console.log('updateClientCourseScheduling::error', e)
      return false;
    }
  }

  // @add_more_methods
  // @end
}

export const updateClientCourseSchedulingSeeder = new UpdateClientCourseSchedulingSeeder();
export { UpdateClientCourseSchedulingSeeder };
