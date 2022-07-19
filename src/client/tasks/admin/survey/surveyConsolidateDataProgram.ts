// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
// @end

// @import_models Import models
// @end

// @import_services
import { surveyDataService } from "@scnode_app/services/default/data/academicContent/survey/surveyDataService";
// @end

// @import_utilitites Import utilities
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
// @end

class SurveyConsolidateDataProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // TODO: Diseñar endpoint/servicio que permita consultar la información consolidada
    // TODO: 1. Se debe recibir un ID de courseScheduling
    // TODO: 2. Identificar la modalidad
    // TODO: 3. Si es Virtual se debe consultar el campo questionsRangeAverage (Promedio general)
    // TODO: 4. Si es Presencial/En linea se debe consultar los courseSchedulingDetails obtener de cada uno el questionsRangeAverage (Promedio general) y generar un promedio de estos
    // TODO: 5. Retornar

    // TODO: Revisar donde se trae la data de la pantalla de programaciones del cliente y agregar el dato de la encuesta
    await surveyDataService.consolidateSurvey({
      output_format: 'db'
    })
    return true; // Always return true | false
  }

  // @add_more_methods
  // @end
}

export const surveyConsolidateDataProgram = new SurveyConsolidateDataProgram();
export { SurveyConsolidateDataProgram };
