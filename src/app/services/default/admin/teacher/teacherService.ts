// @import_dependencies_node Import libraries
// @end

// @import services
import { roleService } from '@scnode_app/services/default/admin/secure/roleService'
import { userService } from '@scnode_app/services/default/admin/user/userService';
import { modularService } from '@scnode_app/services/default/admin/modular/modularService';
import { moodleUserService } from '../../moodle/user/moodleUserService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { campus_setup } from '@scnode_core/config/globals';
import { xlsxUtility } from '@scnode_core/utilities/xlsx/xlsxUtility';
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
// @end

// @import models
import { Modular, Role, AppModulePermission } from '@scnode_app/models'
import { TeacherProfile } from '@scnode_app/models';
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IModular, IModularQuery } from '@scnode_app/types/default/admin/modular/modularTypes'
import { IMassiveLoad, ITeacherQuery, ITeacher, IQualifiedProfessional } from '@scnode_app/types/default/admin/teacher/teacherTypes'
import { IUser } from '@scnode_app/types/default/admin/user/userTypes'
import { IFileProcessResult } from '@scnode_app/types/default/admin/fileProcessResult/fileProcessResultTypes'
import { completionstatusController } from 'app/controllers/default/admin/completionStatus/completionstatusController';

// @end

class TeacherService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public massive = async (params: IMassiveLoad) => {


    try {
      console.log(">>>>>>>>>>> Begin Massive Load of Teachers")

      let singleProfessionalLoadContent: IQualifiedProfessional;
      let content = params.contentFile;

      // 1. Extracción de información de Docentes
      let dataWSTeachersBase = await xlsxUtility.extractXLSX(content.data, 'base docentes y tutores', 0);
      // 2. Extracción de Cursos y Docentes calificados
      let dataWSProfessionals = await xlsxUtility.extractXLSX(content.data, 'Profesionales calificados', 3);

      console.log("Process Content");

      let respProcessTeacherData =  this.processTeacherData(dataWSTeachersBase);

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          teacherProfile: {
            respProcessTeacherData
          }
        }
      })


      //#region     dataWSProfessionals
      try {
        if (dataWSProfessionals != null) {
          console.log("Documentos Profesionales calificados");
          //console.log(dataWSProfessionals);

          let indexP = 1;
          for await (const element of dataWSProfessionals) {

            singleProfessionalLoadContent = {
              documentID: element['Documento de Identidad'],
              email: element['Correo Electrónico'],
              modular: element['Modular'],
              courseCode: element['Código / Versión del Curso'],
              versionStatus: element['Estado de la Versión'],
              courseName: element['Nombre Curso'],
              qualifiedDate: element['Fecha Calificación'],
              qualifiedDocumentationDate: element['Fecha de entrega de la documentación a Calificación'],
              qualifiedFormalizationDate: element['Fecha de Formalización de la calificación'],
              observations: element['Observaciones'],
              specializations: (element['Especializaciones'] != null) ? element['Especializaciones'] : "",
            }

            console.log("-----------ROW: [" + indexP + "] --------------");
            console.log(singleProfessionalLoadContent);

            //#region   ------------- MODULAR -------------
            // 2. Insert Modular: singleProfessionalLoadContent.modular

            if (singleProfessionalLoadContent.modular == null || singleProfessionalLoadContent.modular === '#N/D') {
              // error en modular
            }


            const respModular: any = await modularService.insertOrUpdate({
              name: singleProfessionalLoadContent.modular,
              description: singleProfessionalLoadContent.modular
            });

            console.log("<<<<<<<<<<<<<<< Modular Insertion: >>>>>>>>>>>>>>>>>>>>><<");
            console.log(respModular.modular._id + " - " + respModular.modular.name);
            //#endregion


          }
        }
        else {
          console.log('Empty Doc:  "Profesionales calificados"');
        }
      }
      catch (e) {
        return responseUtility.buildResponseFailed('json', e)
      }
      //#endregion  dataWSProfessionals

    }
    catch (e) {
      return responseUtility.buildResponseFailed('json', e)
    }

  }

  /*
  Creación de usuarios con el rol de Teacher
  */
  private processTeacherData = async (dataWSTeachersBase: any) => {

    let singleUserLoadContent: IUser;
    let processResult: IFileProcessResult;
    let processResultLog = [];
    let userLoadResponse = [];

    //#region   list of Roles
    let roles = {}
    const rolesResponse: any = await roleService.list()
    if (rolesResponse.status === 'success') {
      for await (const iterator of rolesResponse.roles) {
        roles[iterator.name] = iterator._id
      }
    }
    //#endregion

    //#region  dataWSDocentes
    try {
      if (dataWSTeachersBase != null) {
        console.log("Sheet content for: " + dataWSTeachersBase.length + " teachers")
        let index = 1;

        for await (const element of dataWSTeachersBase) {

          if (element['Documento de Identidad'] != null) {
            singleUserLoadContent = {
              username: element['Documento de Identidad'].toString(),
              password: element['Documento de Identidad'].toString(),
              email: element['Correo Electrónico'],
              phoneNumber: element['N° Celular'].toString(),
              roles: [roles['teacher']],
              sendEmail: false, //params.sendEmail
              profile: {
                doc_type: element['Tipo Documento'] ? element['Tipo Documento'] : 'CC',
                doc_number: element['Documento de Identidad'],
                first_name: element['Nombres'],
                last_name: element['Apellidos'],
                city: element['Ubicación'],
                country: 'Colombia',
                regional: element['Regional'],
                contractType: {
                  type: element['Tipo de Vinculación'],
                  isTeacher: element['DOCENTE'] ? true : false,
                  isTutor: element['TUTOR'] ? true : false,
                }
              }
            };

            // Creación de Usuario en CD y en Moodle.
            console.log('Carga >>> Username:' + element['Documento de Identidad']);

            // build process Response
            //#region   Insert User in Campus Digital and Moodle
            const respUser = await userService.insertOrUpdate(singleUserLoadContent);
            userLoadResponse.push(respUser);
            if (respUser.status == 'error') {
              console.log(respUser.message);

              processResult = {
                row: index,
                status: 'ERROR',
                messageProcess: 'DocumentID is empty',
                details: {
                  user: 'Empty',
                  fullname: singleUserLoadContent.profile.first_name + " " + singleUserLoadContent.profile.last_name
                }
              }
              //console.log(processResult)
              processResultLog.push(processResult);
              continue;
            }
            //#endregion   Insert User in Campus Digital and Moodle

            //#region  result after processing record
            processResult = {
              row: index,
              status: 'OK',
              messageProcess: '',
              details: {
                user: singleUserLoadContent.username,
                fullname: singleUserLoadContent.profile.first_name + " " + singleUserLoadContent.profile.last_name
              }
            }
            //console.log(processResult)
            processResultLog.push(processResult);
            //#endregion  result after processing record
          }
          else {
            //console.log("Error at line: " + index);

            processResult = {
              row: index,
              status: 'ERROR',
              messageProcess: 'DocumentID is empty',
              details: {
                user: 'Empty',
                fullname: singleUserLoadContent.profile.first_name + " " + singleUserLoadContent.profile.last_name
              }
            }
            //console.log(processResult)
            processResultLog.push(processResult);
          }
          index++
        }

        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>><");
        console.log(processResultLog);
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>><");

        // let extError = processResultLog.filter(e => e.status === 'ERROR');
        // if (extError) {
        //   console.log("Log de Errores: ");
        //   console.log(extError);
        // }
        // else {
        //   console.log("Carga sin Errores.");
        // }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            ...userLoadResponse
          }
        })

      }
      else {
        // Return Error
        console.log('Empty Doc:  "base docentes y tutores"');
      }
      //#endregion dataWSDocentes

    }
    catch (e) {
      return responseUtility.buildResponseFailed('json', e)
    }
    //#endregion   dataWSDocente

  }

  public list = async (filters: ITeacherQuery = {}) => {

    let qualifiedTeachers = [];

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false
    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    console.log("Enter to Teacher service");

    try {
      // Consultando el ID de Permiso is_teacher
      let roles_ids = [];
      const permission_teacher = await AppModulePermission.findOne({ name: "config:is_teacher" }).select("_id");

      if (permission_teacher) {
        let roles = await Role.find({ app_module_permissions: { $in: permission_teacher._id } }).select("_id");
        if (roles && roles.length > 0) {
          roles_ids = roles.reduce((accum, element) => {
            accum.push(element._id)
            return accum
          }, [])

          filters.roles = roles_ids;
        }
      }

      if (!filters.roles) {
        filters.roles = []
      }

      let teachers: any = await userService.list(filters);


      if (teachers.status == "error")
        return responseUtility.buildResponseFailed('json')


      console.log(teachers.users);

      teachers.users.forEach(element => {

        let teacherData: ITeacher = {
          userData: element,
          // user: element.username,
          // email: element.email,
          // phoneNumber: element.phoneNumber,
          // firstname: element.profile.first_name,
          // lastname: element.profile.last_name,
          // city: element.profile.city,
          // country: element.profile.country,
          // regional: element.profile.regional,

          // Inner query to get contractType
          contractType: {
            type: 'Interno',
            isTeacher: true,
            isTutor: false,
          },
          courses: [
            {
              modular: 'Calidad',
              name: 'first course',
            },
            {
              modular: 'Agroalimentario',
              name: 'second course',
            },
          ]
        };

        qualifiedTeachers.push(teacherData);
      });

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          qualifiedTeachers: [
            ...qualifiedTeachers
          ],
          total_register: (paging) ? await qualifiedTeachers.length : 0,
          pageNumber: pageNumber,
          nPerPage: nPerPage
        }
      })


    } catch (e) {
      return responseUtility.buildResponseFailed("json");
    }
  }

}


export const teacherService = new TeacherService();
export { TeacherService as DefaultAdminTeacherTeacherService };
