// @import_dependencies_node Import libraries
// @end

// @import services
import { roleService } from '@scnode_app/services/default/admin/secure/roleService'
import { userService } from '@scnode_app/services/default/admin/user/userService';
import { modularService } from '@scnode_app/services/default/admin/modular/modularService';
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
import { IQualifiedTeacher } from '@scnode_app/types/default/admin/qualifiedTeachers/qualifiedTeachersTypes'
import { IUser } from '@scnode_app/types/default/admin/user/userTypes'
import { IFileProcessResult } from '@scnode_app/types/default/admin/fileProcessResult/fileProcessResultTypes'
import { generalUtility } from '@scnode_core/utilities/generalUtility';

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

      // 0. Extracción de Cursos y Docentes calificados
      let dataModularMigration = await xlsxUtility.extractXLSX(content.data, 'Migración Modulares', 0);
      let modularMigration = [...new Map(dataModularMigration.map((x) => [x['Modular anterior'], x])).values()];

      // 1. Extracción de información de Docentes
      let dataWSTeachersBase = await xlsxUtility.extractXLSX(content.data, 'base docentes y tutores', 0);
      // 2. Extracción de Cursos y Docentes calificados
      let dataWSProfessionals = await xlsxUtility.extractXLSX(content.data, 'Profesionales calificados', 3);


      //let respProcessTeacherData = await this.processTeacherData(dataWSTeachersBase, 'base docentes y tutores');
      let respProcessQualifiedTeacherData = await this.processQualifiedTeacherData(dataWSProfessionals, modularMigration, 'Profesionales calificados');

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          teacherUpload: {
            ...respProcessQualifiedTeacherData //respProcessTeacherData
          }
        }
      })

    }
    catch (e) {
      return responseUtility.buildResponseFailed('json', e)
    }

  }

  /*
  Creación de usuarios con el rol de Teacher
  */
  private processTeacherData = async (dataWSTeachersBase: any, sheetname: string) => {

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

          if (element['Documento de Identidad']) {

            singleUserLoadContent = {
              username: generalUtility.normalizeUsername(element['Documento de Identidad']),
              password: element['Documento de Identidad'].toString(),
              email: element['Correo Electrónico'],
              phoneNumber: (element['N° Celular']) ? element['N° Celular'].toString().replace(/ /g, "").trim() : '',
              roles: [roles['teacher']],
              sendEmail: false, //params.sendEmail
              profile: {
                doc_type: element['Tipo Documento'] ? element['Tipo Documento'] : 'CC',
                doc_number: element['Documento de Identidad'],
                first_name: element['Nombres'].trim(),
                last_name: element['Apellidos'].trim(),
                city: (element['Ubicación']) ? element['Ubicación'].trim() : '',
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

            let respCampusDataUser: any = await userService.findBy({
              query: QueryValues.ONE,
              where: [{ field: 'profile.doc_number', value: singleUserLoadContent.profile.doc_number }]
            });

            if (respCampusDataUser.status == "error") {
              // USUARIO NO EXISTE EN CAMPUS VIRTUAL
              console.log(">>[CampusVirtual]: El usuario no existe. Creación de Nuevo Usuario");
            }
            else {
              console.log(">>[CampusVirtual]: El usuario ya existe. Actualización de datos datos.");
              singleUserLoadContent.id = respCampusDataUser.user._id.toString();
              console.log(singleUserLoadContent.id);
            }
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

        // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>><");
        // console.log(processResultLog);
        // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>><");

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
            ...processResultLog
          }
        })

      }
      else {
        // Return Error
        console.log('Empty Doc:  "base docentes y tutores"');
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'teacher_upload.empty_file', params: { sheetname: sheetname } } });
      }
      //#endregion dataWSDocentes
    }
    catch (e) {
      console.log('Error: ' + e);

      return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'teacher_upload.failed_upload', params: { error: e } } });
    }
    //#endregion   dataWSDocente

  }

  private processQualifiedTeacherData = async (dataWSQualifiedTeachersBase: any,
    dataModularMigration: any,
    sheetname: string) => {

    let modularList: any = await modularService.list();

    let contentRowTeacher: IQualifiedProfessional;
    let registerQualifiedTeacher: IQualifiedTeacher;
    let processResult: IQualifiedTeacher[] = [];
    let newModulars = [];

    try {

      //#region - Update modulars from Migration
      // Insert the new Modulars from Migration file and then update the general Modular list
      console.log('################################################');
      for await (const row of dataModularMigration) {
        console.log("Search for  " + row['Modular nuevo']);
        let searchModular: any = modularList.modulars.find(field => field['name'].toLowerCase() == row['Modular nuevo'].toLowerCase());
        console.log('-----------------');
        if (!searchModular) {
          newModulars.push({
            anterior: row['Modular anterior'],
            nuevo: row['Modular nuevo'],
          });
          // Insert new Modular:
          const respModular: any = await modularService.insertOrUpdate({
            name: row['Modular nuevo'],
            description: row['Modular nuevo']
          });
          if (respModular.status == 'success') {
            console.log("Modular Insertion: " + respModular.modular._id + " - " + respModular.modular.name);
            modularList = await modularService.list();
          }
        }
      }
      //#endregion

      //#region     dataWSProfessionals
      // try {
      if (dataWSQualifiedTeachersBase != null) {
        console.log("Listado de Profesionales calificados");
        //console.log(dataWSProfessionals);

        let indexP = 5;
        for await (const element of dataWSQualifiedTeachersBase) {

          contentRowTeacher = {
            documentID: element['Documento de Identidad'],
            email: element['Correo Electrónico'],
            modular: element['Modular'],
            courseCode: element['Código / Versión del Curso'],
            versionStatus: element['Estado de la Versión'],
            courseName: element['Nombre Curso'],
            qualifiedDate: element['Fecha Calificación']
          }

          console.log("-----------ROW: [" + indexP + "] --------------");
          //console.log(contentRowTeacher);

          //#region   ------------- MODULAR -------------
          // 2. Insert Modular: singleProfessionalLoadContent.modular

          if (contentRowTeacher.modular == null || contentRowTeacher.modular === '#N/D') {
            // error en modular
            console.log(" ERROR AT  ROW: [" + indexP + "]");

            registerQualifiedTeacher = {
              index: indexP,
              user: contentRowTeacher.documentID,
              modular: 'ERROR: ' + contentRowTeacher.modular,
              courseCode: contentRowTeacher.courseCode,
              courseName: contentRowTeacher.courseName,
              evaluationDate: new Date(contentRowTeacher.qualifiedDate),
              isEnabled: false,
              status: ''
            }
            processResult.push(registerQualifiedTeacher);
            indexP++
            continue;
          }

          let modularID;
          console.log('Find: ' + contentRowTeacher.modular);
          let searchOldModular: any = dataModularMigration.find(field =>
            field['Modular anterior'].toLowerCase() == contentRowTeacher.modular.toLowerCase());

          if (searchOldModular) {
            // take pair value for 'Modular nuevo' and get ModularId
            let localModular: any = modularList.modulars.find(x =>
              x.name.toLowerCase() == searchOldModular['Modular nuevo'].toLowerCase().trim());
            if (localModular) {
              // take ID
              console.log(localModular.name);
              console.log('*************************');
              modularID = localModular._id;
            }
            else {
              // Si no existe ni con el viejo para reemplazar, ni con el nuevo, Insertar
              // const respModular: any = await modularService.insertOrUpdate({
              //   name: contentRowTeacher.modular,
              //   description: contentRowTeacher.modular
              // });
              // console.log("Modular Insertion: " + respModular.modular._id + " - " + respModular.modular.name);
              // modularID = respModular.modular._id;
            }
          }
          else {
            let searchNewModular: any = dataModularMigration.find(field =>
              field['Modular nuevo'].toLowerCase() == contentRowTeacher.modular.toLowerCase());
            if (searchNewModular) {
              console.log(searchNewModular.name);
              console.log('*************************');
              modularID = searchNewModular._id;
            }
          }
          //#endregion

          //#region  ---- Registro de Docente Calificado
          registerQualifiedTeacher = {
            index: indexP,
            user: contentRowTeacher.documentID,
            modular: (modularID) ? modularID : 'WARNING - ' + contentRowTeacher.modular,
            courseCode: contentRowTeacher.courseCode,
            courseName: contentRowTeacher.courseName,
            evaluationDate: new Date(contentRowTeacher.qualifiedDate),
            isEnabled: true,
            status: 'active'
          }
          processResult.push(registerQualifiedTeacher);

          //#endregion

          indexP++;
        }
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            qualifiedTeachers: [
              ...processResult
            ]
            // ,
            // total_register: (paging) ? await qualifiedTeachers.length : 0,
            // pageNumber: pageNumber,
            // nPerPage: nPerPage
          }
        })

      }
      else {
        console.log('Empty Doc:  "Profesionales calificados"');
      }
    }
    catch (e) {
      console.log(e);
      return responseUtility.buildResponseFailed('json', e)
    }
    //#endregion  dataWSProfessionals

  }

  public list = async (filters: ITeacherQuery = {}) => {

    let qualifiedTeachers = [];

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false
    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    console.log("Enter to Teacher service");

    try {
      // Consultando el ID de Permiso is_teacher
      let counter = 1;
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
          position: counter,
          userData: element,

          // Inner query to get Courses
          courses: [
            // {
            //   modular: 'Calidad',
            //   name: 'first course',
            // },
            // {
            //   modular: 'Agroalimentario',
            //   name: 'second course',
            // },
          ]
        };
        qualifiedTeachers.push(teacherData);
        counter++;

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
