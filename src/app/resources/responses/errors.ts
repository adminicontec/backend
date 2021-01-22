// @import_config_files Import config files
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
// @end
class ErrorResponse {

  constructor() {}

  /**
   * Metodo que permite construir un objeto en formato JSON que contiene la estructura de mensajes
   * @returns [json] Objeto en formato JSON
   */
  buildJson() {
    const json = {
      // Add errors
      "post": {
        "category": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.post.category.not_found"),
            "status_code": "post_category_not_found",
            "code": 400
          },
          "insertOrUpdate": {
            "already_exists": {
              "message": i18nUtility.__("app_error_messages.post.category.insertOrUpdate.already_exists"),
              "status_code": "post_category_insertOrUpdate_already_exists",
              "code": 400
            }
          }
        },
        "location": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.post.location.not_found"),
            "status_code": "post_location_not_found",
            "code": 400
          },
          "insertOrUpdate": {
            "already_exists": {
              "message": i18nUtility.__("app_error_messages.post.location.insertOrUpdate.already_exists"),
              "status_code": "post_location_insertOrUpdate_already_exists",
              "code": 400
            }
          }
        },
        "type": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.post.type.not_found"),
            "status_code": "post_type_not_found",
            "code": 400
          },
          "insertOrUpdate": {
            "already_exists": {
              "message": i18nUtility.__("app_error_messages.post.type.insertOrUpdate.already_exists"),
              "status_code": "post_type_insertOrUpdate_already_exists",
              "code": 400
            }
          }
        },
        "post": {

        }
      }
    };

    return json;
  }
}

export default new ErrorResponse().buildJson;
