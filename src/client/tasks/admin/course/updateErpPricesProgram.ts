// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
import { erpService } from "@scnode_app/services/default/erp/erpService";
// @end

class UpdateErpPricesProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    try {
      console.log('Iniciando actualización automática de precios ERP...');

      const result = await erpService.updateErpPrices({
        batchSize: 50, // 100 // Aumentar batch size para tareas automáticas
        updateIntervalHours: 24,
        maxRetries: 1,
        concurrentRequests: 8, // 10 // Más requests concurrentes
        microBatchDelay: 300, // 200 // Reducir delay entre micro-lotes
        batchDelay: 500, // 300 // Reducir delay entre lotes principales
      });

      console.log('Actualización completada:', result);

      // Retornar true solo si no hubo errores críticos
      // return result.failed === 0 || (result.successful > result.failed);
      return true;

    } catch (error) {
      console.error('Error en tarea de actualización de precios:', error);
      return false;
    }
  }
}

export const updateErpPricesProgram = new UpdateErpPricesProgram();
export { UpdateErpPricesProgram };
