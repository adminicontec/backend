// @import_dependencies_node Import libraries
// @end

// @import services
import { roleService } from '@scnode_app/services/default/admin/secure/roleService'
import { userService } from '../user/userService';
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
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IMassiveLoad, ITeacher, IQualifiedProfessional } from '@scnode_app/types/default/admin/teacher/teacherTypes'
import { IUser } from '@scnode_app/types/default/admin/user/userTypes'

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
      let userLoadResponse = [];
      let singleUserLoadContent: ITeacher;
      let singleProfessionalLoadContent: IQualifiedProfessional;
      let content = params.contentFile;

      // 1. Extracción de información de Docentes
      //let dataWSTeachersBase = await xlsxUtility.extractXLSX(content.data, 'base docentes y tutores', 0 );

      let dataWSProfessionals = await xlsxUtility.extractXLSX(content.data, 'Profesionales calificados', 3);


      //#region   dataWSDocentes
      /*
      if (dataWSTeachersBase != null) {
        console.log("Sheet content:")

        for await (const element of dataWSTeachersBase) {

          singleUserLoadContent ={
            documentType: element['Tipo Documento'],
            documentID: element['Documento de Identidad'],
            user: element['Documento de Identidad'].toString(),
            password: element['Documento de Identidad'].toString(),  // <-- Contraseña provisional
            email: element['Correo Electrónico'],
            firstname: element['Nombres'],
            lastname: element['Apellidos'],
            phoneNumber: element['N° Celular'].toString(),
            city: element['Ubicación'],
            country: 'Colombia',
            regional: element['Regional'],
            contractType: {
              type: element['Tipo de Vinculación'],
              isTeacher: element['DOCENTE'] ? true : false,
              isTutor: element['TUTOR'] ? true : false,
            },
            rolename: 'teacher',
            sendEmail: params.sendEmail
          }

          // Creacin de Usuario en CD y en Moodle.
          console.log(singleUserLoadContent);
          console.log('Tipo: ' + element['Tipo Documento']);
          console.log('Doc:' + element['Documento de Identidad']);


          const resp = await this.insertOrUpdate(singleUserLoadContent);

          // build process Response
          userLoadResponse.push(resp);
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            ...userLoadResponse
          }
        })

      }
      else {
        // Return Error
        // console.log("Worksheet not found");
      }*/
      //#endregion dataWSDocentes

      //#region     dataWSProfessionals
      if (dataWSProfessionals != null) {
        console.log("Documentos Profesionales calificados");
        console.log(dataWSProfessionals);

        for await (const element of dataWSProfessionals) {

          singleProfessionalLoadContent ={
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
            specializations:  (element['Especializaciones'] != null) ? element['Especializaciones']  : "",
          }

         console.log("-----------------------------------");
         console.log(singleProfessionalLoadContent);

        }
      }
      else{

      }
      //#endregion  dataWSProfessionals

    }
    catch (e) {
      return responseUtility.buildResponseFailed('json')
    }

  }


  public insertOrUpdate = async (params: ITeacher) => {

    console.log("Begin: teacherService.insertOrUpdate()");
    //#region   list of Roles
    let roles = {}
    const rolesResponse: any = await roleService.list()
    if (rolesResponse.status === 'success') {
      for await (const iterator of rolesResponse.roles) {
        roles[iterator.name] = iterator._id
      }
    }
    //#endregion

    try {
      //#region  UPDATE
      if (params.id) {

      }
      //#endregion

      //#region  Insert
      else {
        console.log("1. Inicio de Inserción de Docente: ");

        // Insertar nuevo Usuario con Rol de Docente (pendiente getRoleIdByName)
        var cvUserParams: IUser = {
          username: params.user,
          email: params.email,
          password: params.password,
          roles: [roles['teacher']], // Id de ROL sujeto a verificación en CV
          phoneNumber: params.phoneNumber,
          profile: {
            first_name: params.firstname,
            last_name: params.lastname,
            doc_type: params.documentType,
            doc_number: params.documentID,
            city: params.city,
            country: params.country,
            regional: params.regional,
          },
          sendEmail: false
        }

        // Insertar nuevo Usuario si no existe
        const respoUser = await userService.insertOrUpdate(cvUserParams);
        if (respoUser.status == "success") {
          params.user = respoUser.user._id

        }
        else {
          // Retornar ERROR: revisar con equipo
          // console.log(respoUser);
        }

      }
      //#endregion
    }
    catch (e) {
      return responseUtility.buildResponseFailed('json')
    }

  }


}

export const teacherService = new TeacherService();
export { TeacherService as DefaultAdminTeacherTeacherService };
