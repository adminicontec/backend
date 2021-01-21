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
      "http": {
        "404": {
          "status_code": "http_404",
          "message": i18nUtility.__("error_messages.http.404"),
          "code": 404
        }
      },
      "fail_request": {
        "status_code": "fail_request",
        "message": i18nUtility.__("error_messages.fail_request_message"),
        "code": 500
      },
      "jwt": {
        "unauthorized_header": {
          "status_code": "jwt_unauthorized_header",
          "message": i18nUtility.__("error_messages.jwt.unauthorized_header_message"),
          "code": 403
        },
        "token_expired": {
          "status_code": "jwt_token_expired",
          "message": i18nUtility.__("error_messages.jwt.token_expired_message"),
          "code": 401
        },
        "token_invalid": {
          "status_code": "jwt_token_invalid",
          "message": i18nUtility.__("error_messages.jwt.token_invalid_message"),
          "code": 401
        }
      },
      "database": {
        "driver_invalid": {
          "status_code": "database_driver_invalid",
          "message": i18nUtility.__("error_messages.database.driver_invalid"),
          "code": 403
        },
        "driver_required": {
          "status_code": "database_driver_required",
          "message": i18nUtility.__("error_messages.database.driver_required"),
          "code": 404
        },
        "orm": {
          "failed_creation": {
            "status_code": "database_orm_failed_creation",
            "message": i18nUtility.__("error_messages.database.orm.failed_creation"),
            "code": 404
          },
          "failed_update": {
            "status_code": "database_orm_failed_update",
            "message": i18nUtility.__("error_messages.database.orm.failed_update"),
            "code": 404
          },
          "register_not_found": {
            "status_code": "database_orm_register_not_found",
            "message": i18nUtility.__("error_messages.database.orm.register_not_found"),
            "code": 404
          },
          "failed_query": {
            "status_code": "database_orm_failed_query",
            "message": i18nUtility.__("error_messages.database.orm.failed_query"),
            "code": 404
          },
          "failed_removal": {
            "status_code": "database_orm_failed_removal",
            "message": i18nUtility.__("error_messages.database.orm.failed_removal"),
            "code": 404
          },
        },
        "seeder": {
          "executed_previously": {
            "status_code": "database_seeder_executed_previously",
            "message": i18nUtility.__("error_messages.database.seeder.executed_previously"),
            "code": 403
          }
        }
      },
      "version_in_request_invalid": {
        "status_code": "version_in_request_invalid",
        "message": i18nUtility.__("error_messages.version_in_request_invalid"),
        "code": 403
      },
      "middleware_not_found": {
        "status_code": "middleware_not_found",
        "message": i18nUtility.__("error_messages.middleware_not_found"),
        "code": 404
      },
      "utility_not_found": {
        "status_code": "utility_not_found",
        "message": i18nUtility.__("error_messages.utility_not_found"),
        "code": 404
      },
      "upload_files": {
        "file_upload_already_exist": {
          "status_code": "upload_files_file_upload_already_exist",
          "message": i18nUtility.__("error_messages.file_upload_already_exist"),
          "code": 403
        }
      },
      "fields_in_request": {
        "invalid_request_fields": {
          "status_code": "fields_in_request_invalid_request_fields",
          "message": i18nUtility.__("error_messages.fields_in_request.invalid_request_fields"),
          "code": 404
        }
      },
      "attached": {
          "driver_required": {
              "status_code": "attached_driver_required",
              "message": i18nUtility.__("error_messages.attached.driver_required"),
              "code": 404
          },
          "driver_invalid": {
              "status_code": "attached_driver_invalid",
              "message": i18nUtility.__("error_messages.attached.driver_invalid"),
              "code": 404
          },
          "configuration_invalid": {
              "status_code": "attached_configuration_invalid",
              "message": i18nUtility.__("error_messages.attached.configuration_invalid"),
              "code": 403
          },
          "failed": {
              "status_code": "attached_failed",
              "message": i18nUtility.__("error_messages.attached.failed"),
              "code": 403
          }
      },
      "mailer": {
          "driver_required": {
              "status_code": "mailer_driver_required",
              "message": i18nUtility.__("error_messages.mailer.driver_required"),
              "code": 404
          },
          "driver_invalid": {
              "status_code": "mailer_driver_invalid",
              "message": i18nUtility.__("error_messages.mailer.driver_invalid"),
              "code": 404
          },
          "configuration_invalid": {
              "status_code": "mailer_configuration_invalid",
              "message": i18nUtility.__("error_messages.mailer.configuration_invalid"),
              "code": 403
          },
          "mailer_fail_request": {
              "status_code": "mailer_mailer_fail_request",
              "message": i18nUtility.__("error_messages.mailer.mailer_fail_request"),
              "code": 500
          },
          "mail_content_required": {
              "status_code": "mailer_mail_content_required",
              "message": i18nUtility.__("error_messages.mailer.mail_content_required"),
              "code": 404
          },
          "mail_content_invalid": {
              "status_code": "mailer_mail_content_invalid",
              "message": i18nUtility.__("error_messages.mailer.mail_content_invalid"),
              "code": 401
          },
          "mail_to_required": {
              "status_code": "mailer_mail_to_required",
              "message": i18nUtility.__("error_messages.mailer.mail_to_required"),
              "code": 404
          },
          "mail_to_invalid": {
              "status_code": "mailer_mail_to_invalid",
              "message": i18nUtility.__("error_messages.mailer.mail_to_invalid"),
              "code": 401
          },
          "mail_cc_invalid": {
              "status_code": "mailer_mail_cc_invalid",
              "message": i18nUtility.__("error_messages.mailer.mail_cc_invalid"),
              "code": 401
          },
          "mail_bcc_invalid": {
              "status_code": "mailer_mail_bcc_invalid",
              "message": i18nUtility.__("error_messages.mailer.mail_bcc_invalid"),
              "code": 401
          },
          "mail_subject_required": {
              "status_code": "mailer_mail_subject_required",
              "message": i18nUtility.__("error_messages.mailer.mail_subject_required"),
              "code": 404
          },
          "mail_subject_invalid": {
              "status_code": "mailer_mail_subject_invalid",
              "message": i18nUtility.__("error_messages.mailer.mail_subject_invalid"),
              "code": 401
          },
          "mail_attachments_invalid": {
              "status_code": "mailer_mail_attachments_invalid",
              "message": i18nUtility.__("error_messages.mailer.mail_attachments_invalid"),
              "code": 401
          },
          "mail_from_invalid": {
              "status_code": "mailer_mail_from_invalid",
              "message": i18nUtility.__("error_messages.mailer.mail_from_invalid"),
              "code": 401
          }
      },
      "sms": {
          "driver_required": {
              "status_code": "sms_driver_required",
              "message": i18nUtility.__("error_messages.sms.driver_required"),
              "code": 404
          },
          "driver_invalid": {
              "status_code": "sms_driver_invalid",
              "message": i18nUtility.__("error_messages.sms.driver_invalid"),
              "code": 404
          },
          "configuration_invalid": {
              "status_code": "sms_configuration_invalid",
              "message": i18nUtility.__("error_messages.sms.configuration_invalid"),
              "code": 403
          },
          "fail_request": {
              "status_code": "sms_fail_request",
              "message": i18nUtility.__("error_messages.sms.fail_request"),
              "code": 500
          },
          "sms_message_required": {
              "status_code": "sms_message_required",
              "message": i18nUtility.__("error_messages.sms.sms_message_required"),
              "code": 500
          },
          "sms_message_invalid_length":{
              "status_code": "sms_message_invalid_length",
              "message": i18nUtility.__("error_messages.sms.sms_message_invalid_length"),
              "code": 500
          },
          "sms_number_required": {
              "status_code": "sms_number_required",
              "message": i18nUtility.__("error_messages.sms.sms_number_required"),
              "code": 500
          },
          "sms_number_invalid": {
              "status_code": "sms_number_invalid",
              "message": i18nUtility.__("error_messages.sms.sms_number_invalid"),
              "code": 500
          },
          "sms_country_code_required": {
              "status_code": "sms_country_code_required",
              "message": i18nUtility.__("error_messages.sms.sms_country_code_required"),
              "code": 500
          },
          "sms_country_code_invalid": {
              "status_code": "sms_country_code_invalid",
              "message": i18nUtility.__("error_messages.sms.sms_country_code_invalid"),
              "code": 500
          }
      },
      "external_connection": {
          "external_connection_method_not_found": {
              "status_code": "external_connection_method_not_found",
              "message": i18nUtility.__("error_messages.external_connection.external_connection_method_not_found"),
              "code": 404
          }
      },
      "re_doc": {
          "file_build_error": {
              "status_code": "re_doc_file_build_error",
              "message": i18nUtility.__("error_messages.re_doc.file_build_error"),
              "code": 500
          },
          "section_required": {
              "status_code": "re_doc_section_required",
              "message": i18nUtility.__("error_messages.re_doc.section_required"),
              "code": 404
          },
          "section_invalid": {
              "status_code": "re_doc_section_invalid",
              "message": i18nUtility.__("error_messages.re_doc.section_invalid"),
              "code": 403
          },
          "section_already_exists": {
              "status_code": "re_doc_section_already_exists",
              "message": i18nUtility.__("error_messages.re_doc.section_already_exists"),
              "code": 403
          },
          "template_not_found": {
              "status_code": "re_doc_template_not_found",
              "message": i18nUtility.__("error_messages.re_doc.template_not_found"),
              "code": 404
          },
          "section_title_invalid": {
              "status_code": "re_doc_section_title_invalid",
              "message": i18nUtility.__("error_messages.re_doc.section_title_invalid"),
              "code": 404
          },
          "component_required": {
              "status_code": "re_doc_component_required",
              "message": i18nUtility.__("error_messages.re_doc.component_required"),
              "code": 404
          },
          "component_invalid": {
              "status_code": "re_doc_component_invalid",
              "message": i18nUtility.__("error_messages.re_doc.component_invalid"),
              "code": 404
          },
          "documentation_not_found": {
              "status_code": "re_doc_documentation_not_found",
              "message": i18nUtility.__("error_messages.re_doc.documentation_not_found"),
              "code": 404
          }
      },
      "plugins": {
          "failed_to_install_the_plugin": {
              "status_code": "plugins_failed_to_install_the_plugin",
              "message": i18nUtility.__("error_messages.plugins.failed_to_install_the_plugin"),
              "code": 403
          },
          "plugin_has_already_been_installed": {
              "status_code": "plugins_plugin_has_already_been_installed",
              "message": i18nUtility.__("error_messages.plugins.plugin_has_already_been_installed"),
              "code": 403
          },
          "controller_already_exist": {
              "status_code": "plugins_controller_already_exist",
              "message": i18nUtility.__("error_messages.plugins.controller_already_exist"),
              "code": 403
          },
          "model_already_exist": {
              "status_code": "plugins_model_already_exist",
              "message": i18nUtility.__("error_messages.plugins.model_already_exist"),
              "code": 403
          },
          "migration_already_exist": {
              "status_code": "plugins_migration_already_exist",
              "message": i18nUtility.__("error_messages.plugins.migration_already_exist"),
              "code": 403
          }
      },
      "auth": {
          "password_invalid": {
              "status_code": "auth_password_invalid",
              "message": i18nUtility.__("error_messages.auth.password_invalid"),
              "code": 403
          },
          "user_not_found": {
              "status_code": "auth_user_not_found",
              "message": i18nUtility.__("error_messages.auth.user_not_found"),
              "code": 403
          },
          "token_update_is_not_possible": {
              "status_code": "auth_token_update_is_not_possible",
              "message": i18nUtility.__("error_messages.auth.token_update_is_not_possible"),
              "code": 403
          },
          "access_denied": {
              "status_code": "auth_access_denied",
              "message": i18nUtility.__("error_messages.auth.access_denied"),
              "code": 403
          }
      },
      "user": {
          "user_create_already_exist": {
              "status_code": "user_create_already_exist",
              "message": i18nUtility.__("error_messages.user.user_create_already_exist"),
              "code": 403
          },
          "user_create_failed": {
              "status_code": "user_create_failed",
              "message": i18nUtility.__("error_messages.user.user_create_failed"),
              "code": 500
          },
          "user_no_found": {
              "status_code": "user_no_found",
              "message": i18nUtility.__("error_messages.user.user_no_found"),
              "code": 500
          }
      },
      "roles": {
          "role_create_already_exist": {
              "status_code": "role_create_already_exist",
              "message": i18nUtility.__("error_messages.roles.role_create_already_exist"),
              "code": 403
          },
          "role_create_failed": {
              "status_code": "role_create_failed",
              "message": i18nUtility.__("error_messages.roles.role_create_failed"),
              "code": 500
          }
      },
      "permissions": {
          "permission_create_already_exist": {
              "status_code": "permission_create_already_exist",
              "message": i18nUtility.__("error_messages.permissions.permission_create_already_exist"),
              "code": 403
          },
          "permission_create_failed": {
              "status_code": "permission_create_failed",
              "message": i18nUtility.__("error_messages.permissions.permission_create_failed"),
              "code": 500
          },
          "parent_id_not_found": {
              "status_code": "permission_parent_id_not_found",
              "message": i18nUtility.__("error_messages.permissions.parent_id_not_found"),
              "code": 500
          },
      },
      "aws": {
          "config_invalid": {
              "status_code": "aws_config_invalid",
                  "message": i18nUtility.__("error_messages.aws.config_invalid"),
                  "code": 403
          },
          "s3": {
              "config_invalid": {
                  "status_code": "aws_s3_config_invalid",
                  "message": i18nUtility.__("error_messages.aws.s3.config_invalid"),
                  "code": 403
              }
          },
          "ses": {
              "config_invalid": {
                  "status_code": "aws_ses_config_invalid",
                  "message": i18nUtility.__("error_messages.aws.ses.config_invalid"),
                  "code": 403
              }
          }
      },
      "ftp": {
          "config_invalid": {
              "status_code": "ftp_config_invalid",
                  "message": i18nUtility.__("error_messages.ftp.config_invalid"),
                  "code": 403
          },
      },
      "query": {
          "invalid_connection_settings": {
              "status_code": "query_invalid_connection_settings",
              "message": i18nUtility.__("error_messages.query.invalid_connection_settings"),
              "code": 403
          },
          "connection_to_server_not_found": {
              "status_code": "query_connection_to_server_not_found",
              "message": i18nUtility.__("error_messages.query.connection_to_server_not_found"),
              "code": 403
          }
      },
      "orm": {
          "model_already_exists": {
              "status_code": "orm.model_already_exists",
              "message": i18nUtility.__("error_messages.orm.model_already_exists"),
              "code": 403
          },
          "migration_already_exists": {
              "status_code": "orm.migration_already_exists",
              "message": i18nUtility.__("error_messages.orm.migration_already_exists"),
              "code": 403
          },
          "failed_to_create_migration": {
              "status_code": "orm.failed_to_create_migration",
              "message": i18nUtility.__("error_messages.orm.failed_to_create_migration"),
              "code": 403
          }
      },
      "pdf": {
          "html_pdf": {
              "fail_to_generate": {
                  "status_code": "pdf_html_pdf_fail_to_generate",
                  "message": i18nUtility.__("error_messages.pdf.html_pdf.fail_to_generate"),
                  "code": 500
              },
              "file_config_required": {
                  "status_code": "pdf_html_pdf_file_config_required",
                  "message": i18nUtility.__("error_messages.pdf.html_pdf.file_config_required"),
                  "code": 403
              },
              "file_not_found": {
                  "status_code": "pdf_html_pdf_file_not_found",
                  "message": i18nUtility.__("error_messages.pdf.html_pdf.file_not_found"),
                  "code": 404
              },
              "content_config_required": {
                  "status_code": "pdf_html_pdf_content_config_required",
                  "message": i18nUtility.__("error_messages.pdf.html_pdf.content_config_required"),
                  "code": 403
              }
          }
      }
    };

    return json;
  }
}

export default new ErrorResponse().buildJson;
