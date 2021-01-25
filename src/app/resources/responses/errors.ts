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
      "secure": {
        "appModule": {
          "permission": {
            "not_found": {
              "message": i18nUtility.__("app_error_messages.secure.appModule.permission.not_found"),
              "status_code": "secure_appModule_permission_not_found",
              "code": 400
            },
            "insertOrUpdate": {
              "already_exists": {
                "message": i18nUtility.__("app_error_messages.secure.appModule.permission.insertOrUpdate.already_exists"),
                "status_code": "secure_appModule_permission_insertOrUpdate_already_exists",
                "code": 400
              }
            }
          },
          "module": {
            "not_found": {
              "message": i18nUtility.__("app_error_messages.secure.appModule.module.not_found"),
              "status_code": "secure_appModule_module_not_found",
              "code": 400
            },
            "insertOrUpdate": {
              "already_exists": {
                "message": i18nUtility.__("app_error_messages.secure.appModule.module.insertOrUpdate.already_exists"),
                "status_code": "secure_appModule_module_insertOrUpdate_already_exists",
                "code": 400
              }
            }
          }
        },
        "role": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.secure.role.not_found"),
            "status_code": "secure_appModule_role_not_found",
            "code": 400
          },
          "insertOrUpdate": {
            "already_exists": {
              "message": i18nUtility.__("app_error_messages.secure.role.insertOrUpdate.already_exists"),
              "status_code": "secure_appModule_role_insertOrUpdate_already_exists",
              "code": 400
            }
          }
        }
      },
      "user": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.user.not_found"),
          "status_code": "user_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.user.insertOrUpdate.already_exists"),
            "status_code": "user_insertOrUpdate_already_exists",
            "code": 400
          },
          "password_required": {
            "message": i18nUtility.__("app_error_messages.user.insertOrUpdate.password_required"),
            "status_code": "user_insertOrUpdate_password_required",
            "code": 400
          }
        }
      },
      "country": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.country.not_found"),
          "status_code": "country_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.country.insertOrUpdate.already_exists"),
            "status_code": "country_insertOrUpdate_already_exists",
            "code": 400
          }
        }
      },
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
          "not_found": {
            "message": i18nUtility.__("app_error_messages.post.post.not_found"),
            "status_code": "post_post_not_found",
            "code": 400
          },
          "post_date_required": {
            "message": i18nUtility.__("app_error_messages.post.post.post_date_required"),
            "status_code": "post_post_post_date_required",
            "code": 400
          },
          "event_date_required": {
            "message": i18nUtility.__("app_error_messages.post.post.event_date_required"),
            "status_code": "post_post_event_date_required",
            "code": 400
          }
        }
      }
    };

    return json;
  }
}

export default new ErrorResponse().buildJson;
