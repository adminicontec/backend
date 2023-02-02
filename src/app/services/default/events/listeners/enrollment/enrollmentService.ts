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
  IParamsUpdateLoadParticipantsSchedule,
  ILogEnrollment
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

    try {
      await this.updateLoadParticipantsScheduling({
        loading: true,
        schedulingId: params.courseScheduling
      })

      let log: ILogEnrollment[] = [];
      const content = params.contentFile;

      const dataFromWorksheet = await xlsxUtility.extractXLSX(content.data, 'Estudiantes', 0, 500);

      if (dataFromWorksheet) {
        if (Array.isArray(dataFromWorksheet)) {
          if (dataFromWorksheet.length > 0) {
            const courseScheduling = await CourseScheduling.findOne({ _id: params.courseScheduling })
              .select('id account_executive moodle_id')
              .populate({ path: 'account_executive', select: 'id profile.first_name profile.last_name' })
              .populate({ path: 'schedulingType', select: 'id name' })
              .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
              .lean()

            let index = 2;

            let enrollmentCode = 1;
            const lastEnrollmentCode: any = await enrollmentAdminService.getLastEnrollmentCode({
              courseID: courseScheduling.moodle_id,
            });
            if (lastEnrollmentCode?.enrollmentCode) enrollmentCode = lastEnrollmentCode.enrollmentCode + 1;

            for await (const element of dataFromWorksheet) {

              try {

                this.checkHeaderField(element,'Tipo Documento','La columna Tipo Documento no esta presente en el documento o esta vacia')
                this.checkHeaderField(element,'Documento de Identidad','La columna Documento de Identidad no esta presente en el documento o esta vacia')
                this.checkHeaderField(element,'Apellidos','La columna Apellidos no esta presente en el documento o esta vacia')
                this.checkHeaderField(element,'Nombres','La columna Nombres no esta presente en el documento o esta vacia')
                this.checkHeaderField(element,'Correo Electrónico','La columna Correo Electrónico no esta presente en el documento o esta vacia')
                this.checkHeaderField(element,'Regional','La columna Regional no esta presente en el documento o esta vacia')
                this.checkHeaderField(element,'Ciudad','La columna Ciudad no esta presente en el documento o esta vacia')
                this.checkHeaderField(element,'País','La columna País no esta presente en el documento o esta vacia')


                let dob = moment.utc('1990-01-01');
                if (element['Fecha Nacimiento']) {
                  const dateString = element['Fecha Nacimiento'].toString()
                  dob = moment.utc(dateString, 'YYYY-MM-DD', true);
                  if (!dob.isValid()) throw new Error(`El formato de fecha de nacimiento ${dateString} no es valido`)
                }

                // const newUserID = generalUtility.normalizeUsername(element['Documento de Identidad']);

                let newUserEmail = generalUtility.normalizeEmail(element['Correo Electrónico']);
                newUserEmail = generalUtility.removeAccents(newUserEmail)
                if (!generalUtility.validateEmailFormat(newUserEmail)) throw new Error(`El correo electrónico ${newUserEmail} no tiene formato adecuado`)

                let originField = '';
                const schedulingType = courseScheduling?.schedulingType?.name?.toLowerCase() || ''
                const schedulingMode = courseScheduling?.schedulingMode?.name.toLowerCase() || ''
                if (
                  schedulingType == 'abierto' &&
                  (schedulingMode == 'virtual' || schedulingMode == 'en linea')
                ) {
                  this.checkHeaderField(element,'Ejecutivo','El campo Ejecutivo es obligatorio')
                  originField = element['Ejecutivo'];
                }
                else {
                  originField = (courseScheduling?.account_executive?.profile) ? `${courseScheduling?.account_executive?.profile.first_name} ${courseScheduling?.account_executive?.profile.last_name}` : null;
                }
                const documentID = element['Documento de Identidad'].trim().replace(/\./g, "");
                let singleUserEnrollmentContent: IEnrollment = {
                  documentType: element['Tipo Documento'].trim().toUpperCase(),
                  documentID: documentID,
                  user: documentID,
                  password: documentID,
                  email: newUserEmail,
                  firstname: element['Nombres'].trim(),
                  lastname: element['Apellidos'].trim(),
                  phoneNumber: (element['N° Celular (opcional)']) ? element['N° Celular (opcional)'].toString().replace(/ /g, "").trim() : '',
                  city: (element['Ciudad']) ? element['Ciudad'].trim() : null,
                  country: (element['País']) ? element['País'].trim() : null,
                  timezone: (element['Zona horaria (opcional)']) ? element['Zona horaria (opcional)'].split(' - ')[0].trim() : null,
                  emailAlt: element['Correo Alt'], // TODO: revisar si esto hace algo
                  regional: element['Regional'],
                  birthdate: dob.format('YYYY-MM-DD'),
                  job: element['Cargo'], // TODO: revisar si esto hace algo
                  title: element['Profesión'], // TODO: revisar si esto hace algo
                  educationalLevel: element['Nivel Educativo'], // TODO: revisar si esto hace algo
                  company: element['Empresa'], // TODO: revisar si esto hace algo
                  genre: element['Género'], // TODO: revisar si esto hace algo
                  origin: originField,
                  courseID: params.courseID,
                  rolename: 'student',
                  courseScheduling: params.courseScheduling,
                  sendEmail: params.sendEmail,
                  enrollmentCode
                }

                const respEnrollment: any = await enrollmentAdminService.insertOrUpdate(singleUserEnrollmentContent);
                console.log('respEnrollment', respEnrollment)
                if (respEnrollment.status === 'success') {
                  enrollmentCode++;
                  log.push({
                    row: index,
                    status: 'OK'
                  })
                }
                else {
                  if (respEnrollment.status_code === 'enrollment_insertOrUpdate_already_exists') {
                    log.push({
                      row: index,
                      status: 'OK',
                      message: `El usuario ${documentID} ya se encuentra matriculado`
                    })
                  }
                  else {
                    log.push({
                      row: index,
                      status: 'ERROR',
                      message: respEnrollment.message || 'Se ha presentado un error al matricular al estudiante'
                    })
                  }
                }
              } catch (err) {
                log.push({
                  row: index,
                  status: 'ERROR',
                  message: err?.message || 'Se ha presentado un error inesperado'
                })
              }
              index++;
            }
          } else {
            log.push(
              {
                row: 0,
                status: 'ERROR',
                message: 'La hoja con nombre "Estudiantes" no tiene información para cargar',
              }
            );
          }
        }
      }
      else {
        log.push(
          {
            row: 0,
            status: 'ERROR',
            message: 'La hoja con nombre "Estudiantes" no existe en el archivo cargado',
          }
        );
      }

      const extError = log.filter(e => e.status === 'ERROR');
      const extSuccess = log.filter(e => e.status === 'OK');

      const updateData = {
        loading: false,
        schedulingId: params.courseScheduling,
        lastUploadDate: new Date(),
        status: undefined,
        errors: [],
        success: extSuccess
      }

      if (extError.length > 0) {
        updateData.status = 'error';
        updateData.errors = extError;
      } else {
        updateData.status = 'success';
      }
      await this.updateLoadParticipantsScheduling(updateData)

      return responseUtility.buildResponseFailed('json', null, {
        additional_parameters: {
          total_created: extSuccess.length,
          errors: extError
        }
      })

    } catch (err) {
      await this.updateLoadParticipantsScheduling({
        loading: false,
        status: 'error',
        schedulingId: params.courseScheduling,
        errors: [{
          row: 0,
          status: 'ERROR',
          message: err?.message || 'Se ha presentado un error inesperado en el procesamiento del archivo de matriculas'
        }],
        success: [],
        lastUploadDate: new Date()
      })
    }

  }


  private checkHeaderField = (register: any, field: string, messsage: string) => {
    try {
      if (!register[field]) throw new Error(messsage)
      return true;
    } catch (err) {
      throw new Error(err.message)
    }
  }
}

export const enrollmentService = new EnrollmentService();
export { EnrollmentService as DefaultEventsListenersEnrollmentEnrollmentService };
