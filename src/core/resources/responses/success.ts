// @import_config_files Import config files
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
// @end

class SuccessResponse {
  constructor() {}

  /**
   * Metodo que permite construir un objeto en formato JSON que contiene la estructura de mensajes
   * @returns [json] Objeto en formato JSON
   */
  buildJson() {
    const json = {
      "framework_default_success": {
        "message": i18nUtility.__("success_messages.framework_default_success")
      },
      "request_success": {
        "message": i18nUtility.__("success_messages.request_success_message")
      },
      "upload_files": {
        "file_upload_successfully": {
          "message": i18nUtility.__("success_messages.file_upload_successfully")
        }
      },
      "mailer": {
        "mail_send_successfully": {
          "message": i18nUtility.__("success_messages.mailer.mail_send_successfully")
        }
      },
      "database": {
        "seeder": {
          "executed_successfully": {
            "message": i18nUtility.__("success_messages.database.seeder.executed_successfully")
          },
          "executed_warning": {
            "message": i18nUtility.__("success_messages.database.seeder.executed_warning")
          }
        }
      },
      "orm": {
        "migrations_not_enabled": {
          "message": i18nUtility.__("success_messages.orm.migrations_not_enabled")
        }
      }
    }

    return json;
  }
}

export default new SuccessResponse().buildJson;
