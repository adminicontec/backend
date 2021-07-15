// @import_config_files Import config files
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
// @end
class ErrorResponse {

  constructor() { }

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
        },
        "environment": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.secure.environment.not_found"),
            "status_code": "secure_appModule_environment_not_found",
            "code": 400
          },
          "insertOrUpdate": {
            "already_exists": {
              "message": i18nUtility.__("app_error_messages.secure.environment.insertOrUpdate.already_exists"),
              "status_code": "secure_appModule_environment_insertOrUpdate_already_exists",
              "code": 400
            }
          }
        },
        "tokenFromDestination": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.secure.tokenFromDestination.not_found"),
            "status_code": "secure_tokenFromDestination_not_found",
            "code": 400
          },
          "token_expired": {
            "message": i18nUtility.__("app_error_messages.secure.tokenFromDestination.token_expired"),
            "status_code": "secure_tokenFromDestination_token_expired",
            "code": 400
          },
          "user_not_found": {
            "message": i18nUtility.__("app_error_messages.secure.tokenFromDestination.user_not_found"),
            "status_code": "secure_tokenFromDestination_user_not_found",
            "code": 400
          },
          "destination_required": {
            "message": i18nUtility.__("app_error_messages.secure.tokenFromDestination.destination_required"),
            "status_code": "secure_tokenFromDestination_destination_required",
            "code": 400
          },
          "destination_invalid": {
            "message": i18nUtility.__("app_error_messages.secure.tokenFromDestination.destination_invalid"),
            "status_code": "secure_tokenFromDestination_destination_invalid",
            "code": 400
          },
          "email_required": {
            "message": i18nUtility.__("app_error_messages.secure.tokenFromDestination.email_required"),
            "status_code": "secure_tokenFromDestination_email_required",
            "code": 400
          },
          "cell_phone_required": {
            "message": i18nUtility.__("app_error_messages.secure.tokenFromDestination.cell_phone_required"),
            "status_code": "secure_tokenFromDestination_cell_phone_required",
            "code": 400
          }
        },
      },
      "home": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.home.not_found"),
          "status_code": "home_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.home.insertOrUpdate.already_exists"),
            "status_code": "home_insertOrUpdate_already_exists",
            "code": 400
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
        },
        "current_password_invalid": {
          "message": i18nUtility.__("app_error_messages.user.current_password_invalid"),
          "status_code": "user_current_password_invalid",
          "code": 400
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
          },
          "filter_to_search_required": {
            "message": i18nUtility.__("app_error_messages.post.post.filter_to_search_required"),
            "status_code": "post_post_filter_to_search_required",
            "code": 400
          }
        }
      },
      "regional": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.regional.not_found"),
          "status_code": "regional_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.regional.insertOrUpdate.already_exists"),
            "status_code": "regional_insertOrUpdate_already_exists",
            "code": 400
          }
        }
      },
      "company": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.company.not_found"),
          "status_code": "company_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.company.insertOrUpdate.already_exists"),
            "status_code": "company_insertOrUpdate_already_exists",
            "code": 400
          }
        },
        "filter_to_search_required": {
          "message": i18nUtility.__("app_error_messages.company.filter_to_search_required"),
          "status_code": "company_filter_to_search_required",
          "code": 400
        }
      },

      "forum": {
        "category": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.forum.category.not_found"),
            "status_code": "forum_category_not_found",
            "code": 400
          },
          "insertOrUpdate": {
            "already_exists": {
              "message": i18nUtility.__("app_error_messages.forum.category.insertOrUpdate.already_exists"),
              "status_code": "forum_category_insertOrUpdate_already_exists",
              "code": 400
            }
          }
        },
        "location": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.forum.location.not_found"),
            "status_code": "forum_location_not_found",
            "code": 400
          },
          "insertOrUpdate": {
            "already_exists": {
              "message": i18nUtility.__("app_error_messages.forum.location.insertOrUpdate.already_exists"),
              "status_code": "forum_location_insertOrUpdate_already_exists",
              "code": 400
            }
          }
        },
        "forum": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.forum.forum.not_found"),
            "status_code": "forum_forum_not_found",
            "code": 400
          },
          "post_date_required": {
            "message": i18nUtility.__("app_error_messages.forum.forum.post_date_required"),
            "status_code": "forum_forum_post_date_required",
            "code": 400
          }
        },
        "message": {
          "invalid": {
            "message": i18nUtility.__("app_error_messages.forum.message.invalid"),
            "status_code": "forum_message_invalid",
            "code": 400
          },
          "not_found": {
            "message": i18nUtility.__("app_error_messages.forum.message.not_found"),
            "status_code": "forum_message_not_found",
            "code": 400
          },
          "delete": {
            "only_my_messages": {
              "message": i18nUtility.__("app_error_messages.forum.message.delete.only_my_messages"),
              "status_code": "forum_message_delete_only_my_messages",
              "code": 400
            },
            "fail_action": {
              "message": i18nUtility.__("app_error_messages.forum.message.delete.fail_action"),
              "status_code": "forum_message_delete_fail_action",
              "code": 400
            }
          }
        }
      },
      "skillType": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.skilltype.not_found"),
          "status_code": "skill_type_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.skilltype.insertOrUpdate.already_exists"),
            "status_code": "skill_type_insertOrUpdate_already_exists",
            "code": 400
          }
        }
      },
      "course": {
        "filter_to_search_required": {
          "message": i18nUtility.__("app_error_messages.course.filter_to_search_required"),
          "status_code": "course_filter_to_search_required",
          "code": 400
        },
        "mode_category": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.course.mode_category.not_found"),
            "status_code": "course_mode_category_not_found",
            "code": 400
          },
          "insertOrUpdate": {
            "already_exists": {
              "message": i18nUtility.__("app_error_messages.course.mode_category.insertOrUpdate.already_exists"),
              "status_code": "course_mode_category_insertOrUpdate_already_exists",
              "code": 400
            }
          }
        },
        "not_found": {
          "message": i18nUtility.__("app_error_messages.course.not_found"),
          "status_code": "course_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "cost_required": {
            "message": i18nUtility.__("app_error_messages.course.insertOrUpdate.cost_required"),
            "status_code": "course_insertOrUpdate_cost_required",
            "code": 400
          },
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.course.insertOrUpdate.already_exists"),
            "status_code": "course_insertOrUpdate_already_exists",
            "code": 400
          }
        }
      },
      "program": {
        'not_found': {
          "message": i18nUtility.__("app_error_messages.program.not_found"),
          "status_code": "program_not_found",
          "code": 400
        },
        'insertOrUpdate': {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.program.insertOrUpdate.already_exists"),
            "status_code": "program_insertOrUpdate_already_exists",
            "code": 400
          }
        }
      },
      "modular": {
        'not_found': {
          "message": i18nUtility.__("app_error_messages.modular.not_found"),
          "status_code": "modular_not_found",
          "code": 400
        },
        'insertOrUpdate': {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.modular.insertOrUpdate.already_exists"),
            "status_code": "modular_insertOrUpdate_already_exists",
            "code": 400
          }
        }
      },
      "city": {
        'not_found': {
          "message": i18nUtility.__("app_error_messages.city.not_found"),
          "status_code": "city_not_found",
          "code": 400
        },
        'insertOrUpdate': {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.city.insertOrUpdate.already_exists"),
            "status_code": "city_insertOrUpdate_already_exists",
            "code": 400
          }
        }
      },
      "course_scheduling": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.course_scheduling.not_found"),
          "status_code": "course_scheduling_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "failed": {
            "message": i18nUtility.__("app_error_messages.course_scheduling.insertOrUpdate.failed"),
            "status_code": "course_scheduling_insertOrUpdate_failed",
            "code": 400
          }
        },
        "status": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.course_scheduling.status.not_found"),
            "status_code": "course_scheduling_status_not_found",
            "code": 400
          },
          "insertOrUpdate": {
            "already_exists": {
              "message": i18nUtility.__("app_error_messages.course_scheduling.status.insertOrUpdate.already_exists"),
              "status_code": "course_scheduling_status_insertOrUpdate_already_exists",
              "code": 400
            }
          }
        },
        "section": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.course_scheduling.section.not_found"),
            "status_code": "course_scheduling_section_not_found",
            "code": 400
          },
          "insertOrUpdate": {
            "already_exists": {
              "message": i18nUtility.__("app_error_messages.course_scheduling.section.insertOrUpdate.already_exists"),
              "status_code": "course_scheduling_section_insertOrUpdate_already_exists",
              "code": 400
            }
          }
        },
        "type": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.course_scheduling.type.not_found"),
            "status_code": "course_scheduling_type_not_found",
            "code": 400
          },
          "insertOrUpdate": {
            "already_exists": {
              "message": i18nUtility.__("app_error_messages.course_scheduling.type.insertOrUpdate.already_exists"),
              "status_code": "course_scheduling_type_insertOrUpdate_already_exists",
              "code": 400
            }
          }
        },
        "mode": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.course_scheduling.mode.not_found"),
            "status_code": "course_scheduling_mode_not_found",
            "code": 400
          },
          "insertOrUpdate": {
            "already_exists": {
              "message": i18nUtility.__("app_error_messages.course_scheduling.mode.insertOrUpdate.already_exists"),
              "status_code": "course_scheduling_mode_insertOrUpdate_already_exists",
              "code": 400
            }
          }
        },
      },
      "moodle_course": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.moodle_course.not_found"),
          "status_code": "moodle_course_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.moodle_course.insertOrUpdate.already_exists"),
            "status_code": "moodle_course_insertOrUpdate_already_exists",
            "code": 400
          },
          "category_not_found": {
            "message": i18nUtility.__("app_error_messages.moodle_course.insertOrUpdate.category_not_found"),
            "status_code": "moodle_course_insertOrUpdate_category_not_found",
            "code": 400
          },
          "course_not_found": {
            "message": i18nUtility.__("app_error_messages.moodle_course.insertOrUpdate.course_not_found"),
            "status_code": "moodle_course_insertOrUpdate_course_not_found",
            "code": 400
          },
        }
      },
      "enrollment": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.enrollment.not_found"),
          "status_code": "enrollment_course_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.enrollment.insertOrUpdate.already_exists"),
            "status_code": "enrollment_insertOrUpdate_already_exists",
            "code": 400
          }
        }
      },
      "moodle_enrollment": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.moodle_enrollment.not_found"),
          "status_code": "moodle_enrollment_course_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.moodle_enrollment.insertOrUpdate.already_exists"),
            "status_code": "moodle_enrollment_insertOrUpdate_already_exists",
            "code": 400
          }
        },
        "empty": {
          "message": i18nUtility.__("app_error_messages.moodle_enrollment.empty"),
          "status_code": "moodle_enrollment_empty",
          "code": 400
        },
      },
      "moodle_user": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.moodle_user.not_found"),
          "status_code": "moodle_user_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "failed": {
            "message": i18nUtility.__("app_error_messages.moodle_user.insertOrUpdate.failed"),
            "status_code": "moodle_user_insertOrUpdate_failed",
            "code": 400

          }
        }
      },
    };

    return json;
  }
}

export default new ErrorResponse().buildJson;
