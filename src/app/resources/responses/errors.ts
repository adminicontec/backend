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
      "landing": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.landing.not_found"),
          "status_code": "landing_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.landing.insertOrUpdate.already_exists"),
            "status_code": "landing_insertOrUpdate_already_exists",
            "code": 400
          }
        },
        "trainings": {
          "delete": {
            "not_found": {
              "message": i18nUtility.__("app_error_messages.landing.trainings.delete.not_found"),
              "status_code": "landing_trainings_delete_not_found",
              "code": 400
            }
          }
        },
        "scheduling": {
          "delete": {
            "not_found": {
              "message": i18nUtility.__("app_error_messages.landing.scheduling.delete.not_found"),
              "status_code": "landing_scheduling_delete_not_found",
              "code": 400
            }
          }
        }
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
      "questionCategory": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.questionCategory.not_found"),
          "status_code": "questionCategory_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.questionCategory.insertOrUpdate.already_exists"),
            "status_code": "questionCategory_insertOrUpdate_already_exists",
            "code": 400
          },
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.questionCategory.insertOrUpdate.fail_action"),
            "status_code": "questionCategory_insertOrUpdate_fail_action",
            "code": 400
          }
        },
        "delete": {
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.questionCategory.delete.fail_action"),
            "status_code": "questionCategory_delete_fail_action",
            "code": 400
          }
        },
      },
      "question": {
        "category_invalid": {
          "message": i18nUtility.__("app_error_messages.question.category_invalid"),
          "status_code": "question_category_invalid",
          "code": 400
        },
        "value_required": {
          "message": i18nUtility.__("app_error_messages.question.value_required"),
          "status_code": "question_value_required",
          "code": 400
        },
        "answers": {
          "required": {
            "message": i18nUtility.__("app_error_messages.question.answers.required"),
            "status_code": "question_answers_required",
            "code": 400
          },
          "invalid": {
            "message": i18nUtility.__("app_error_messages.question.answers.invalid"),
            "status_code": "question_answers_invalid",
            "code": 400
          },
          "limit": {
            "message": i18nUtility.__("app_error_messages.question.answers.limit"),
            "status_code": "question_answers_limit",
            "code": 400
          },
          "answers_value_invalid": {
            "message": i18nUtility.__("app_error_messages.question.answers.answers_value_invalid"),
            "status_code": "question_answers_answers_value_invalid",
            "code": 400
          },
          "answer_corrected_required": {
            "message": i18nUtility.__("app_error_messages.question.answers.answer_corrected_required"),
            "status_code": "question_answers_answer_corrected_required",
            "code": 400
          },
          "answer_corrected_limit": {
            "message": i18nUtility.__("app_error_messages.question.answers.answer_corrected_limit"),
            "status_code": "question_answers_answer_corrected_limit",
            "code": 400
          },
          "relate_item": {
            "relation_required": {
              "message": i18nUtility.__("app_error_messages.question.answers.relate_item.relation_required"),
              "status_code": "question_answers_relate_item_relation_required",
              "code": 400
            },
            "relation_invalid": {
              "message": i18nUtility.__("app_error_messages.question.answers.relate_item.relation_invalid"),
              "status_code": "question_answers_relate_item_relation_invalid",
              "code": 400
            }
          },
          "fill_in_spaces": {
            "words_required": {
              "message": i18nUtility.__("app_error_messages.question.answers.fill_in_spaces.words_required"),
              "status_code": "question_answers_fill_in_spaces_words_required",
              "code": 400
            },
            "words_data_invalid": {
              "message": i18nUtility.__("app_error_messages.question.answers.fill_in_spaces.words_data_invalid"),
              "status_code": "question_answers_fill_in_spaces_words_data_invalid",
              "code": 400
            },
            "config_invalid": {
              "message": i18nUtility.__("app_error_messages.question.answers.fill_in_spaces.config_invalid"),
              "status_code": "question_answers_fill_in_spaces_config_invalid",
              "code": 400
            }
          }
        },
        "not_found": {
          "message": i18nUtility.__("app_error_messages.question.not_found"),
          "status_code": "question_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.question.insertOrUpdate.fail_action"),
            "status_code": "question_insertOrUpdate_fail_action",
            "code": 400
          },
          "tag_duplicated": {
            "message": i18nUtility.__("app_error_messages.question.insertOrUpdate.tag_duplicated"),
            "status_code": "questionTag_insertOrUpdate_tag_duplicated",
            "code": 400
          }
        },
        "delete": {
          "node_invalid": {
            "message": i18nUtility.__("app_error_messages.question.delete.node_invalid"),
            "status_code": "question_delete_node_invalid",
            "code": 400
          },
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.question.delete.fail_action"),
            "status_code": "question_delete_fail_action",
            "code": 400
          }
        },
        "qualification": {
          "answers_required": {
            "message": i18nUtility.__("app_error_messages.question.qualification.answers_required"),
            "status_code": "question_qualification_answers_required",
            "code": 400
          },
          "answer_format_invalid": {
            "message": i18nUtility.__("app_error_messages.question.qualification.answer_format_invalid"),
            "status_code": "question_qualification_answer_format_invalid",
            "code": 400
          },
          "answer_selected_invalid": {
            "message": i18nUtility.__("app_error_messages.question.qualification.answer_selected_invalid"),
            "status_code": "question_qualification_answer_selected_invalid",
            "code": 400
          }
        }
      },
      "academicResourceCategory": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.academicResourceCategory.not_found"),
          "status_code": "academicResourceCategory_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.academicResourceCategory.insertOrUpdate.already_exists"),
            "status_code": "academicResourceCategory_insertOrUpdate_already_exists",
            "code": 400
          },
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.academicResourceCategory.insertOrUpdate.fail_action"),
            "status_code": "academicResourceCategory_insertOrUpdate_fail_action",
            "code": 400
          }
        },
        "delete": {
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.academicResourceCategory.delete.fail_action"),
            "status_code": "academicResourceCategory_delete_fail_action",
            "code": 400
          }
        },
      },
      "academicResource": {
        "category_invalid": {
          "message": i18nUtility.__("app_error_messages.academicResource.category_invalid"),
          "status_code": "academicResource_category_invalid",
          "code": 400
        },
        "not_found": {
          "message": i18nUtility.__("app_error_messages.academicResource.not_found"),
          "status_code": "academicResource_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.academicResource.insertOrUpdate.fail_action"),
            "status_code": "academicResource_insertOrUpdate_fail_action",
            "code": 400
          }
        },
        "delete": {
          "node_invalid": {
            "message": i18nUtility.__("app_error_messages.academicResource.delete.node_invalid"),
            "status_code": "academicResource_delete_node_invalid",
            "code": 400
          },
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.academicResource.delete.fail_action"),
            "status_code": "academicResource_delete_fail_action",
            "code": 400
          }
        },
        "resources": {
          "questions_invalid": {
            "message": i18nUtility.__("app_error_messages.academicResource.resources.questions_invalid"),
            "status_code": "academicResource_resources_questions_invalid",
            "code": 400
          },
          "duration_invalid": {
            "message": i18nUtility.__("app_error_messages.academicResource.resources.duration_invalid"),
            "status_code": "academicResource_resources_duration_invalid",
            "code": 400
          },
          "survey_resource": {
            "config_invalid": {
              "message": i18nUtility.__("app_error_messages.academicResource.resources.survey_resource.config_invalid"),
              "status_code": "academicResource_resources_survey_resource_config_invalid",
              "code": 400
            },
            "question_bank_invalid": {
              "message": i18nUtility.__("app_error_messages.academicResource.resources.survey_resource.question_bank_invalid"),
              "status_code": "academicResource_resources_survey_resource_question_bank_invalid",
              "code": 400
            },
            "question_configuration": {
              "invalid": {
                "message": i18nUtility.__("app_error_messages.academicResource.resources.survey_resource.question_configuration.invalid"),
                "status_code": "academicResource_resources_survey_resource_question_configuration_invalid",
                "code": 400
              }
            }
          },
        },
        "qualification": {
          "questions_to_evaluate_required": {
            "message": i18nUtility.__("app_error_messages.academicResource.qualification.questions_to_evaluate_required"),
            "status_code": "academicResource_qualification_questions_to_evaluate_required",
            "code": 400
          }
        },
        "attempt": {
          "status_ended": {
            "message": i18nUtility.__("app_error_messages.academicResource.attempt.status_ended"),
            "status_code": "academicResource_attempt_status_ended",
            "code": 400
          }
        },
        "fetchAcademicResourceData": {
          "survey": {
            "invalid": {
              "message": i18nUtility.__("app_error_messages.academicResource.fetchAcademicResourceData.survey.invalid"),
              "status_code": "academicResource_fetchAcademicResourceData_survey_invalid",
              "code": 400
            }
          },
          "config": {
            "max_attemps": {
              "message": i18nUtility.__("app_error_messages.academicResource.fetchAcademicResourceData.config.max_attemps"),
              "status_code": "academicResource_fetchAcademicResourceData_config_max_attemps",
              "code": 400
            },
            "availability_range": {
              "start_end": {
                "message": i18nUtility.__("app_error_messages.academicResource.fetchAcademicResourceData.config.availability_range.start_end"),
                "status_code": "academicResource_fetchAcademicResourceData_config_availability_range.start_end",
                "code": 400
              },
              "end": {
                "message": i18nUtility.__("app_error_messages.academicResource.fetchAcademicResourceData.config.availability_range.end"),
                "status_code": "academicResource_fetchAcademicResourceData_config_availability_range.end",
                "code": 400
              },
              "start": {
                "message": i18nUtility.__("app_error_messages.academicResource.fetchAcademicResourceData.config.availability_range.start"),
                "status_code": "academicResource_fetchAcademicResourceData_config_availability_range.start",
                "code": 400
              }
            }
          }
        },
      },
      "academicResourceConfigCategory": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.academicResourceConfigCategory.not_found"),
          "status_code": "academicResourceConfigCategory_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "already_exists": {
            "message": i18nUtility.__("app_error_messages.academicResourceConfigCategory.insertOrUpdate.already_exists"),
            "status_code": "academicResourceConfigCategory_insertOrUpdate_already_exists",
            "code": 400
          },
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.academicResourceConfigCategory.insertOrUpdate.fail_action"),
            "status_code": "academicResourceConfigCategory_insertOrUpdate_fail_action",
            "code": 400
          }
        },
        "delete": {
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.academicResourceConfigCategory.delete.fail_action"),
            "status_code": "academicResourceConfigCategory_delete_fail_action",
            "code": 400
          }
        },
      },
      "academicResourceConfig": {
        "category_invalid": {
          "message": i18nUtility.__("app_error_messages.academicResourceConfig.category_invalid"),
          "status_code": "academicResourceConfig_category_invalid",
          "code": 400
        },
        "not_found": {
          "message": i18nUtility.__("app_error_messages.academicResourceConfig.not_found"),
          "status_code": "academicResourceConfig_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.academicResourceConfig.insertOrUpdate.fail_action"),
            "status_code": "academicResourceConfig_insertOrUpdate_fail_action",
            "code": 400
          }
        },
        "delete": {
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.academicResourceConfig.delete.fail_action"),
            "status_code": "academicResourceConfig_delete_fail_action",
            "code": 400
          }
        },
      },
      "survey": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.survey.not_found"),
          "status_code": "survey_not_found",
          "code": 400
        },
        "insertOrUpdate": {
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.survey.insertOrUpdate.fail_action"),
            "status_code": "survey_insertOrUpdate_fail_action",
            "code": 400
          },
          "content_required": {
            "message": i18nUtility.__("app_error_messages.survey.insertOrUpdate.content_required"),
            "status_code": "survey_insertOrUpdate_content_required",
            "code": 400
          }
        },
        "delete": {
          "fail_action": {
            "message": i18nUtility.__("app_error_messages.survey.delete.fail_action"),
            "status_code": "survey_delete_fail_action",
            "code": 400
          }
        },
        "results": {
          "surveys_required": {
            "message": i18nUtility.__("app_error_messages.survey.results.surveys_required"),
            "status_code": "survey_results_surveys_required",
            "code": 400
          },
          "surveys_invalid": {
            "message": i18nUtility.__("app_error_messages.survey.results.surveys_invalid"),
            "status_code": "survey_results_surveys_invalid",
            "code": 400
          }
        },
        "report": {
          "invalid_container": {
            "message": i18nUtility.__("app_error_messages.survey.report.invalid_container"),
            "status_code": "survey_report_invalid_container",
            "code": 400
          },
          "survey_not_found": {
            "message": i18nUtility.__("app_error_messages.survey.report.survey_not_found"),
            "status_code": "survey_report_survey_not_found",
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
        "tag": {
          "not_found": {
            "message": i18nUtility.__("app_error_messages.forum.tag.not_found"),
            "status_code": "forum_tag_not_found",
            "code": 400
          },
          "insertOrUpdate": {
            "already_exists": {
              "message": i18nUtility.__("app_error_messages.forum.tag.insertOrUpdate.already_exists"),
              "status_code": "forum_tag_insertOrUpdate_already_exists",
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
      "calendarEvent": {
        "exception": {
          "message": i18nUtility.__("app_error_messages.calendarEvent.exception"),
          "status_code": "calendar_event_exception",
          "code": 400
        },
      },
      "grades": {
        "exception": {
          "message": i18nUtility.__("app_error_messages.grades.exception"),
          "status_code": "grades_exception",
          "code": 400
        },
        "moodle_exception": {
          "message": i18nUtility.__("app_error_messages.grades.moodle_exception"),
          "status_code": "grades_moodle_exception",
          "code": 400
        },
      },
      "moodle": {
        "exception": {
          "message": i18nUtility.__("app_error_messages.moodle.exception"),
          "status_code": "moodle_exception",
          "code": 400
        },
        "error": {
          "message": i18nUtility.__("app_error_messages.moodle.error"),
          "status_code": "moodle_error",
          "code": 400
        }
      },
      "moodle_category": {
        "not_found": {
          "message": i18nUtility.__("app_error_messages.moodle_category.not_found"),
          "status_code": "moodle_category_not_found",
          "code": 400
        }
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
      "certificate": {
        "login_invalid": {
          "message": i18nUtility.__("app_error_messages.certificate.login_invalid"),
          "status_code": "certificate_login_invalid",
          "code": 400
        },
        "not_found": {
          "message": i18nUtility.__("app_error_messages.certificate.not_found"),
          "status_code": "certificate_not_found",
          "code": 400
        },
        "generation": {
          "message": i18nUtility.__("app_error_messages.certificate.generation"),
          "status_code": "certificate_generation",
          "code": 400
        },
        "requirements": {
          "program_status": {
            "message": i18nUtility.__("app_error_messages.certificate.requirements.program_status"),
            "status_code": "certificate_requeriments_program_status",
            "code": 400
          },
          "student_status": {
            "message": i18nUtility.__("app_error_messages.certificate.requirements.student_status"),
            "status_code": "certificate_requeriments_student_status",
            "code": 400
          }
        },
        "queue": {
          "insertOrUpdate": {
            "failed": {
              "message": i18nUtility.__("app_error_messages.moodle_user.insertOrUpdate.failed"),
              "status_code": "certificate_queue_insertOrUpdate_failed",
              "code": 400
            }
          },
          "not_found": {
            "message": i18nUtility.__("app_error_messages.certificate.queue.not_found"),
            "status_code": "certificate_queue_not_found",
            "code": 400
          },
        }
      }
    };
    return json;
  }
}

export default new ErrorResponse().buildJson;
