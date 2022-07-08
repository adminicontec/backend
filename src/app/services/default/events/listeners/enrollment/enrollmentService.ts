// @import_dependencies_node Import libraries
import moment from 'moment';
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { IFileProcessResult } from '@scnode_app/types/default/admin/fileProcessResult/fileProcessResultTypes';
import { xlsxUtility } from '@scnode_core/utilities/xlsx/xlsxUtility';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import {enrollmentService as enrollmentAdminService} from '@scnode_app/services/default/admin/enrollment/enrollmentService'
// @end

// @import models
import { CourseScheduling } from '@scnode_app/models';
// @end

// @import types
import {
  IEnrollment,
  IMassiveEnrollment,
  IParamsUpdateLoadParticipantsSchedule
} from '@scnode_app/types/default/admin/enrollment/enrollmentTypes';
// @end

class EnrollmentService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public updateLoadParticipantsScheduling = async (params: IParamsUpdateLoadParticipantsSchedule) => {
    const courseScheduling = await CourseScheduling.findOne({_id: params.schedulingId})
    if (courseScheduling) {
      const loadParticipants = courseScheduling.loadParticipants ? {...courseScheduling.loadParticipants} : {};
      Object.assign(loadParticipants, params)
      await CourseScheduling.findByIdAndUpdate(params.schedulingId, {loadParticipants}, { useFindAndModify: false, new: true })
    }
  }

  public enrollmentMassiveEvent = async (params: IMassiveEnrollment) => {

    await this.updateLoadParticipantsScheduling({ loading: true, schedulingId: params.courseScheduling })

    console.log('llego aca', params)

    let processResult: IFileProcessResult;
    let errors = [];

    console.log(">>>>>>>>>>> Begin Massive Enrollment")
    let userEnrollmentResponse = [];
    let singleUserEnrollmentContent: IEnrollment;
    // console.log("Begin file process for courseID: " + params.courseID)
    let content = params.contentFile;

    let dataFromWorksheet = await xlsxUtility.extractXLSX(content.data, 'Estudiantes', 0, 100);

    if (dataFromWorksheet != null) {
      console.log("Sheet content:" + dataFromWorksheet.length + " records");

      const courseScheduling = await CourseScheduling.findOne({ _id: params.courseScheduling })
        .select('id account_executive')
        .populate({ path: 'account_executive', select: 'id profile.first_name profile.last_name' })
        .populate({ path: 'schedulingType', select: 'id name' })
        .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
        .lean()

      console.log("Datos Curso");
      console.log(`Línea: ${courseScheduling.schedulingType.name}`);
      console.log(`Modalidad: ${courseScheduling.schedulingMode.name}`);

      let index = 1;

      for await (const element of dataFromWorksheet) {

        let dob = '';
        // check for element['Fecha Nacimiento']
        if (element['Fecha Nacimiento']) {
          dob = moment.utc(element['Fecha Nacimiento'].toString()).format('YYYY-MM-DD');
        }
        else {
          dob = moment.utc('1990-01-01').format('YYYY-MM-DD');
        }

        //#region   Revisión Documento de identidad para Casos especiales

        if (!element['Tipo Documento']) {
          processResult = {
            row: index,
            status: 'ERROR',
            messageProcess: 'El campo Tipo Documento está vacío.',
          }
          errors.push(processResult);
          continue;
        }

        if (element['Documento de Identidad']) {

          var newUserID = generalUtility.normalizeUsername(element['Documento de Identidad']);
          console.log(">>> Insert Username " + newUserID);
          let checkEmail = element['Correo Electrónico'];
          if (checkEmail != null) {
            checkEmail = generalUtility.normalizeEmail(checkEmail);

            if (generalUtility.validateEmailFormat(checkEmail)) {

              let originField = '';
              if (courseScheduling.schedulingType.name.toLowerCase() == 'abierto' && (courseScheduling.schedulingMode.name.toLowerCase() == 'virtual' || courseScheduling.schedulingMode.name.toLowerCase() == 'en linea')) {
                originField = element['Ejecutivo'];
              }
              else {
                originField = (courseScheduling?.account_executive?.profile) ? `${courseScheduling?.account_executive?.profile.first_name} ${courseScheduling?.account_executive?.profile.last_name}` : null;
              }

              console.log(`Origin for ${element['Nombres']}: ${originField}`);
              singleUserEnrollmentContent =
              {
                documentType: element['Tipo Documento'].trim().toUpperCase(),
                documentID: element['Documento de Identidad'].trim().replace(/\./g, ""),
                user: element['Documento de Identidad'].trim(),
                password: element['Documento de Identidad'].trim().replace(/\./g, ""), // <-- Contraseña provisional
                email: checkEmail,
                firstname: element['Nombres'].trim(),
                lastname: element['Apellidos'].trim(),
                phoneNumber: (element['N° Celular']) ? element['N° Celular'].toString().replace(/ /g, "").trim() : '',
                city: (element['Ciudad']) ? element['Ciudad'].trim() : null,
                country: element['País'],
                emailAlt: element['Correo Alt'],
                regional: element['Regional'],
                birthdate: dob,
                job: element['Cargo'],
                title: element['Profesión'],
                educationalLevel: element['Nivel Educativo'],
                company: element['Empresa'],
                genre: element['Género'],
                origin: originField,
                courseID: params.courseID,
                rolename: 'student',
                courseScheduling: params.courseScheduling,
                sendEmail: params.sendEmail
              }
              const respEnrollment: any = await enrollmentAdminService.insertOrUpdate(singleUserEnrollmentContent);
              if (respEnrollment.status == 'success') {
                processResult = {
                  row: index,
                  status: 'OK',
                  messageProcess: '',
                  details: {
                    user: singleUserEnrollmentContent.user,
                    fullname: singleUserEnrollmentContent.firstname + " " + singleUserEnrollmentContent.lastname
                  }
                }
              }
              else {
                if (respEnrollment.status_code === 'enrollment_insertOrUpdate_already_exists') {
                  processResult = {
                    row: index,
                    status: 'WARN',
                    messageProcess: "Ya existe una matricula para el estudiante " + singleUserEnrollmentContent.user,
                    details: {
                      user: singleUserEnrollmentContent.user,
                      fullname: singleUserEnrollmentContent.firstname + " " + singleUserEnrollmentContent.lastname
                    }
                  }

                }
                else {
                  processResult = {
                    row: index,
                    status: 'ERROR',
                    messageProcess: "Error al matricular al estudiante ",
                    details: {
                      user: singleUserEnrollmentContent.user,
                      fullname: singleUserEnrollmentContent.firstname + " " + singleUserEnrollmentContent.lastname
                    }
                  }
                }
              }
              // build process Response
              userEnrollmentResponse.push(respEnrollment);
            }
            else {
              processResult = {
                row: index,
                status: 'ERROR',
                messageProcess: 'Campo email no tiene formato adecuado: ' + checkEmail,
              }
            }
          }
          else {
            // error por email vacío
            processResult = {
              row: index,
              status: 'ERROR',
              messageProcess: 'Campo email está vacío.',
              details: {
                user: 'Empty'
              }
            }
          }
          console.log("<<<<<<<<< Resultado individual >>>>>>>>>>>>>>>>>>><<<<");
          console.log(processResult);
          errors.push(processResult);
        }
        else {
          // Log the Error
          processResult = {
            row: index,
            status: 'ERROR',
            messageProcess: 'El campo Documento de Identidad está vacío.',
          }
          errors.push(processResult);
        }
        index++;
        //#endregion
      }

    }
    else {
      errors.push(
        {
          row: 0,
          status: 'ERROR',
          messageProcess: 'La hoja con nombre "Estudiantes" no existe en el archivo cargado',
        }
      );
    }

    console.log("°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°")
    console.log("         Resultados de carga de archivo:");
    console.log(errors)
    console.log("°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°")

    let extError = errors.filter(e => e.status === 'ERROR');
    let extSuccess = errors.filter(e => e.status === 'OK');

    console.log('extError', extError)
    console.log('extSuccess', extSuccess)

    if (extError.length > 0) {
      await this.updateLoadParticipantsScheduling({
        loading: false,
        status: 'error',
        schedulingId: params.courseScheduling,
        errors: extError,
        success: [],
        lastUploadDate: new Date()
      })

      return responseUtility.buildResponseFailed('json', null, {
        additional_parameters: {
          total_created: extSuccess.length,
          errors: extError
        }
      })
    }

    await this.updateLoadParticipantsScheduling({
      loading: false,
      status: 'success',
      schedulingId: params.courseScheduling,
      errors: [],
      success: extSuccess,
      lastUploadDate: new Date()
    })

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        successfully: extSuccess
      }
    })
  }
}

export const enrollmentService = new EnrollmentService();
export { EnrollmentService as DefaultEventsListenersEnrollmentEnrollmentService };
