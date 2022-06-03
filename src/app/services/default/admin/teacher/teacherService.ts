// @import_dependencies_node Import libraries
import moment from 'moment';
// @end

// @import services
import { roleService } from '@scnode_app/services/default/admin/secure/roleService'
import { userService } from '@scnode_app/services/default/admin/user/userService';
import { modularService } from '@scnode_app/services/default/admin/modular/modularService';
import { uploadService } from '@scnode_core/services/default/global/uploadService'
import { documentQueueService } from '@scnode_app/services/default/admin/documentQueue/documentQueueService';
import { qualifiedTeachersService } from "@scnode_app/services/default/admin/qualifiedTeachers/qualifiedTeachersService"
import { courseSchedulingDetailsService } from '@scnode_app/services/default/admin/course/courseSchedulingDetailsService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { xlsxUtility } from '@scnode_core/utilities/xlsx/xlsxUtility';
// @end

// @import models
import { Modular, Role, AppModulePermission } from '@scnode_app/models'
import { TeacherProfile } from '@scnode_app/models';
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IModular, IModularQuery } from '@scnode_app/types/default/admin/modular/modularTypes'
import { IMassiveLoad, IUploadFile, ITeacherQuery, ITeacher, IQualifiedProfessional } from '@scnode_app/types/default/admin/teacher/teacherTypes'
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

  private default_document_path = 'documents/qualified';

  constructor() { }

  /**
   * Upload  of qualified teacher file and put it on a document queue
   */
  public upload = async (params: IUploadFile, files?: any) => {

    try {
      const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (files && files.file_xlsx && typeof files.file_xlsx === 'object') {
        if (files.file_xlsx.mimetype === mimeType) {
          const response_upload: any = await uploadService.uploadFile(files.file_xlsx, this.default_document_path);

          if (response_upload.status === 'error') return response_upload;

          // console.log('*********************************');
          // console.dir(response_upload, { depth: null, colors: true });
          // console.log('*********************************');

          // save record on documents_queue to trigger the  documentProcessor
          const respDocumentQueue: any = await documentQueueService.insertOrUpdate({
            status: 'New',
            type: 'Qualified Teacher',
            docPath: response_upload.path,
            userId: params.userID,
            sendEmail: params.sendEmail === 'true' ? true : false
          });

          if (respDocumentQueue.status == 'error') {
            return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'document.queue.insertOrUpdate.failed', params: { error: respDocumentQueue.error } } });
          }

          console.log('----------------------------');
          console.dir(respDocumentQueue, { depth: null, colors: true });
          console.log('----------------------------');

          return responseUtility.buildResponseSuccess('json', null, {
            additional_parameters: {
              upload: respDocumentQueue.documentQueue
            }
          });
        }
        else {
          return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'teacher_upload.wrong_mime_type' } });
        }
      }
      else {
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'teacher_upload.empty_file', params: { error: files } } });
      }
    }

    catch (e) {
      return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'teacher_upload.empty_file', params: { error: e } } });
    }
  }


  public processFile = async (params: IMassiveLoad) => {

    console.log(">>>>>>>>>>> Begin Massive Load of Qualified Teachers")
    try {
      let singleProfessionalLoadContent: IQualifiedProfessional;
      let content = params.contentFile;
      let record = params.recordToProcess;

      // 0. Extracción de Cursos y Docentes calificados
      let dataModularMigration = await xlsxUtility.extractXLSX(content.data, 'Migración Modulares', 0);
      let modularMigration = []
      if (dataModularMigration) {
        let onlyModulars = [];

        // let essencial items
        dataModularMigration.forEach(element => {
          onlyModulars.push({
            modular_anterior: generalUtility.normalizeString(element['Modular anterior']),
            modular_nuevo: generalUtility.normalizeString(element['Modular nuevo'])
          });
        });

        onlyModulars.sort((a, b) => a.modular_anterior.localeCompare(b.modular_anterior));

        //console.log('------------------------');
        ///console.log('modularMigration');
        modularMigration = [...new Map(onlyModulars.map((x) => [x.modular_nuevo, x])).values()];
        //console.table(modularMigration);
      }

      // 1. Extracción de información de Docentes
      let dataWSTeachersBase = await xlsxUtility.extractXLSX(content.data, 'base docentes y tutores', 0);
      // 2. Extracción de Cursos y Docentes calificados
      let dataWSProfessionals = await xlsxUtility.extractXLSX(content.data, 'Profesionales calificados', 3);

      // 3. Extracción de Tutores calificados
      let dataWSTutores = await xlsxUtility.extractXLSX(content.data, 'Tutores calificados', 2);

      let errorLog = []
      let processLog = []
      let respProcessQualifiedTeacherData: any = {}
      let respProcessQualifiedTutorData: any = {}
      let respProcessTeacherData = await this.processTeacherData(dataWSTeachersBase, 'base docentes y tutores');

      if (dataWSProfessionals) {
        respProcessQualifiedTeacherData = await this.processQualifiedTeacherData(dataWSProfessionals, modularMigration, 'Profesionales calificados');
        if (respProcessQualifiedTeacherData?.qualifiedTeachers) {
          processLog = processLog.concat(respProcessQualifiedTeacherData?.qualifiedTeachers)
          //console.table(processLog);
        }
        if (respProcessQualifiedTeacherData?.errorLog) {
          errorLog = errorLog.concat(respProcessQualifiedTeacherData?.errorLog)
          ///console.table(errorLog);
        }
      }
      if (dataWSTutores) {
        respProcessQualifiedTutorData = await this.processQualifiedTeacherData(dataWSTutores, modularMigration, 'Tutores calificados');
        if (respProcessQualifiedTutorData?.qualifiedTeachers) {
          processLog = processLog.concat(respProcessQualifiedTutorData?.qualifiedTeachers)
        }
        if (respProcessQualifiedTutorData?.errorLog) {
          errorLog = errorLog.concat(respProcessQualifiedTutorData?.errorLog)
        }
      }

      // Update processed record
      // processError

      const respDocumentQueue: any = await documentQueueService.insertOrUpdate({
        id: record.id,
        status: 'Complete',
        processLog: processLog,
        errorLog: errorLog,
        // processLogTutor: respProcessQualifiedTutorData?.qualifiedTeachers,
        // errorLogTutor: respProcessQualifiedTutorData?.errorLog
      });

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          processFile: {
            ...respDocumentQueue //respProcessQualifiedTeacherData
          }
        }
      })

    }
    catch (e) {
      console.log('error', e)
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
                  ranking: (element['Escalafón / Contratación']) ? element['Escalafón / Contratación'] : null
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
    let processError = [];
    let newModulars = [];
    let test = []

    try {

      //#region - Update modulars from Migration
      // Insert the new Modulars from Migration file and then update the general Modular list
      console.log('################################################');
      for await (const row of dataModularMigration) {
        //console.log("Search for: " + row.modular_nuevo);
        let searchModular: any = modularList.modulars.find(field => field['name'].toLowerCase() == row.modular_nuevo.toLowerCase());
        //console.log('-----------------');
        //console.log(searchModular);
        if (!searchModular) {
          newModulars.push({
            anterior: row.modular_anterior,
            nuevo: row.modular_nuevo,
          });
          // Insert new Modular:
          const respModular: any = await modularService.insertOrUpdate({
            name: row.modular_nuevo,
            description: row.modular_nuevo
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

        let indexP = 5;
        for await (const element of dataWSQualifiedTeachersBase) {

          let flagAddRegister = false;
          let stringDate = (element['Fecha Calificación']) ? element['Fecha Calificación'].toString() : null;
          let qualifiedDate = (stringDate) ? moment(stringDate, 'DD/MM/YYYY').format('YYYY-MM-DD') : null;

          // console.log(`>>> Fecha calificación: ${element['Fecha Calificación']}`);
          // console.log(`>>> Fecha calificación: ${stringDate} - ${qualifiedDate}`);

          // 11/12/21
          // 14/11/21
          contentRowTeacher = {
            documentID: element['Documento de Identidad'],
            email: element['Correo Electrónico'],
            modular: element['Modular'],
            courseCode: element['Código / Versión del Curso'],
            versionStatus: element['Estado de la Versión'],
            courseName: element['Nombre Curso'],
            qualifiedDate: qualifiedDate
          }

          console.log("--------------");
          console.log(`Record for ${contentRowTeacher.documentID} ${element['Nombre Profesional']}- code: ${contentRowTeacher.courseCode}`);

          //#region   ------------- MODULAR -------------
          // 2. Insert Modular: singleProfessionalLoadContent.modular

          if (contentRowTeacher.modular == null || contentRowTeacher.modular === '#N/D') {
            // error en modular
            // console.log(" ERROR AT  ROW: [" + indexP + "]");

            processError.push({
              sheetName: sheetname,
              errorType: 'ModularEmpty',
              row: indexP,
              col: 'Modular',
              message: 'el valor del Modular está vacío',
              data: contentRowTeacher
            });
            test.push(`Index: ${indexP} contentRowTeacher: ${contentRowTeacher.documentID} | ${contentRowTeacher.modular}`)

            indexP++
            continue;
          }

          let modularID;

          let searchOldModular: any = dataModularMigration.find(field =>
            field.modular_anterior.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") == generalUtility.normalizeString(contentRowTeacher.modular).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

          if (searchOldModular) {
            // take pair value for 'Modular nuevo' and get ModularId
            let localModular: any = modularList.modulars.find(x =>
              x.name.toLowerCase() == searchOldModular.modular_nuevo.toLowerCase().trim());
            if (localModular) {
              // take ID
              // console.log('OLD:\t' + localModular.name + '\t[' + localModular._id) + ']';
              modularID = localModular._id;
              flagAddRegister = true;
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
              field.modular_nuevo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") == generalUtility.normalizeString(contentRowTeacher.modular).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
            //field.modular_nuevo.toLowerCase() == contentRowTeacher.modular.toLowerCase());
            if (searchNewModular) {
              let localModular: any = modularList.modulars.find(x =>
                x.name.toLowerCase() == searchNewModular.modular_nuevo.toLowerCase().trim());
              if (localModular) {
                // take ID
                // console.log('NEW:\t' + localModular.name + '\t[' + localModular._id) + ']';
                modularID = localModular._id;
                flagAddRegister = true;
              }
            }
            else {
              // console.log("-----------ROW: [" + indexP + "] --------------");
              // console.log('Find: ' + contentRowTeacher.modular);
              // console.log('normalize: [' + contentRowTeacher.modular.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() + ']');

              // console.log(" Cant't find any equivalent to [" + contentRowTeacher.modular + "]");
              // console.log(searchNewModular);

              processError.push({
                sheetName: sheetname,
                errorType: 'ModularMissmatch',
                message: `Modular [${contentRowTeacher.modular}] no encontrado en hoja de Migración para el docente con numero de documento ${contentRowTeacher.documentID}`,
                row: indexP,
                col: 'Modular',
                data: contentRowTeacher.modular
              });
              test.push(`Index: ${indexP} contentRowTeacher: ${contentRowTeacher.documentID} | ${contentRowTeacher.modular}`)
              indexP++
              continue;
            }
          }
          //#endregion

          //#region --------------- Get User Id from numDoc ---------------

          let respCampusDataUser: any = await userService.findBy({
            query: QueryValues.ONE,
            where: [{ field: 'profile.doc_number', value: contentRowTeacher.documentID }]
          });

          if (respCampusDataUser.status == "error") {
            // USUARIO NO EXISTE EN CAMPUS VIRTUAL
            // console.log(">>[CampusVirtual]: Usuario no existe. No se puede crear registro");
            // log de error
            processError.push({
              sheetName: sheetname,
              errorType: 'UserNotFound',
              message: 'Usuario ' + contentRowTeacher.documentID + ' no encontrado',
              row: indexP,
              col: 'Documento de Identidad',
              data: contentRowTeacher.documentID
            });
            test.push(`Index: ${indexP} contentRowTeacher: ${contentRowTeacher.documentID} | ${contentRowTeacher.modular}`)
            indexP++;
            continue;
          }

          // console.log(">>[CampusVirtual]: Usuario encontrado. Inserción de registro");
          // console.log("::::: " + contentRowTeacher.documentID);
          //#endregion

          //#region  ---- Registro de Docente Calificado
          registerQualifiedTeacher = {
            index: indexP,
            teacher: respCampusDataUser.user._id,
            modular: modularID, //(modularID) ? modularID : 'WARNING - ' + contentRowTeacher.modular,
            courseCode: contentRowTeacher.courseCode,
            courseName: contentRowTeacher.courseName,
            evaluationDate: new Date(contentRowTeacher.qualifiedDate),
            isEnabled: true,
            status: (contentRowTeacher.versionStatus != null || (contentRowTeacher.versionStatus != '#N/D')) ? contentRowTeacher.versionStatus : 'INACTIVO',
            sheetName: sheetname
          }

          // console.log("::::::::::::::::::::::::::::::::::::::::::::::::");
          // console.log(registerQualifiedTeacher); //, { depth: null, colors: true });
          // console.log("::::::::::::::::::::::::::::::::::::::::::::::::");


          const respIfExistQualifiedTeacher: any = await qualifiedTeachersService.findBy(
            {
              query: QueryValues.ONE,
              where: [
                { field: 'courseCode', value: registerQualifiedTeacher.courseCode },
                { field: 'teacher', value: registerQualifiedTeacher.teacher }
              ]
            }
          );

          if (respIfExistQualifiedTeacher.status == 'success') {
            console.log(`There's a record for user ${contentRowTeacher.documentID} and course code ${contentRowTeacher.courseCode}`)
            registerQualifiedTeacher.id = respIfExistQualifiedTeacher.qualified_teacher._id;
          }

          const respQualifiedTeacher: any = await qualifiedTeachersService.insertOrUpdate(registerQualifiedTeacher);
          if (respQualifiedTeacher.status == 'error') {
            console.log('Error insertando Docente Calificado.');
            console.log(`${registerQualifiedTeacher.teacher} - ${contentRowTeacher.documentID} - ${contentRowTeacher.modular} - ${contentRowTeacher.courseCode}`);

            processError.push({
              sheetName: sheetname,
              errorType: 'RegisterQualifiedTeacher',
              message: `Registro de Docente calificado no pudo ser insertado ${respQualifiedTeacher.message}`,
              row: indexP,
              col: 'Full register',
              data: `${registerQualifiedTeacher.teacher} - ${contentRowTeacher.documentID} - ${contentRowTeacher.modular} - ${contentRowTeacher.courseCode}`
            });

            test.push(`Index: ${indexP} contentRowTeacher: ${contentRowTeacher.documentID} | ${contentRowTeacher.modular}`)
            indexP++;
            continue;

          }
          else {
            console.log(`Éxito en acción con Docente Calificado: ${respQualifiedTeacher.qualifiedTeacher.action}`);
            registerQualifiedTeacher.action = respQualifiedTeacher.qualifiedTeacher.action;
            processResult.push(registerQualifiedTeacher);
          }
          //#endregion
          test.push(`Index: ${indexP} contentRowTeacher: ${contentRowTeacher.documentID} | ${contentRowTeacher.modular}`)
          indexP++;

          console.log("--------------");
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            qualifiedProcess: processResult.length,
            qualifiedTeachers: [
              ...processResult
            ],
            errorLog: [
              ...processError
            ]
            // ,
            // total_register: (paging) ? await qualifiedTeachers.length : 0,
            // pageNumber: pageNumber,
            // nPerPage: nPerPage
          }
        })

      }
      else {
        // console.log('Empty Doc:  "Profesionales calificados"');
      }
    }
    catch (e) {
      // console.log(e);
      return responseUtility.buildResponseFailed('json', e)
    }
    //#endregion  dataWSProfessionals

  }

  public list = async (filters: ITeacherQuery = {}) => {

    let qualifiedTeachers = [];

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false
    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    // console.log("Enter to Teacher service");

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


      // console.log(teachers.users);

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
          total_register: (paging) ? teachers.total_register : 0,
          pageNumber: teachers.pageNumber,
          nPerPage: teachers.nPerPage
        }
      })


    } catch (e) {
      return responseUtility.buildResponseFailed("json");
    }
  }

  public merge = async (filters: ITeacherQuery = {}) => {
    let qualifiedRecords = [];
    let schedulingRecords = [];
    let deletedUser = '';

    console.log('Merge duplicated teacher records:');
    console.log(filters);

    try {

      const respUser: any = await userService.findBy({ query: QueryValues.ALL, where: [{ field: 'username', value: filters.username }] });
      if (respUser.status == 'error') {
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'user.not_found' } });
      }

      //console.log(respUser.users);

      if (respUser.users.length > 1) {
        let principalId;

        for await (const userData of respUser.users) {

          console.log("Get Qualified Data for: " + userData._id);

          if (userData.moodle_id) {
            console.log("take this UserData as principal");
            console.log(userData.moodle_id);
            principalId = userData._id;
          }
          else {
            console.log("Move this profile data to main record.");
            console.log(userData);

            // update profile data for first user record
            let respUpdateUserData: any = await userService.insertOrUpdate({
              id: principalId,
              profile: userData.profile
            });
            console.log('respUpdateUserData');
            console.log(respUpdateUserData);
            if (respUpdateUserData.status == "error") {

            }

            // check if there's Qualified Teachers related to user Id

            let respQualifiedTeacher: any = await qualifiedTeachersService.list({ teacher: userData._id });
            console.log('records for teacher:');
            if (respQualifiedTeacher.status == 'error') {
              return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'qualified_teacher.error' } });
            }
            console.log(respQualifiedTeacher.qualifiedTeachers.length);

            for await (let record of respQualifiedTeacher.qualifiedTeachers) {
              // update each record with principalId
              let respUpdateRecord: any = await qualifiedTeachersService.insertOrUpdate({
                id: record._id,
                teacher: principalId
              });

              console.log("respUpdateRecord");
              console.log(respUpdateRecord);
              qualifiedRecords.push(respUpdateRecord);
            }

            // check if there's scheduling associated to this user Id (duplicate)
            let respCourseSched: any = await courseSchedulingDetailsService.list({ teacher: userData._id });
            console.log('*******************************');
            console.log(respCourseSched.schedulings);

            for(let scheduleRecord of respCourseSched.schedulings){
              let respUpdateRecord: any = await courseSchedulingDetailsService.insertOrUpdate({
                id: scheduleRecord._id,
                teacher: principalId
              });

              console.log("respUpdateRecord");
              console.log(respUpdateRecord);
              schedulingRecords.push(respUpdateRecord.scheduling);
            }
            // delete duplicated records
            let respDeletedUser: any = await userService.delete({
              id: userData._id
            });
            console.log('respDeletedUser');
            console.log(respDeletedUser);
            if (respDeletedUser.status == "error") {

            }

          }

        }

      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          mergedTeachers: qualifiedRecords,
          totalMerged: qualifiedRecords.length,
          mergedScheduling: schedulingRecords,
          totalScheduling: schedulingRecords.length,
        }
      })
    }
    catch (e) {
      return responseUtility.buildResponseFailed("json");
    }

  }

}


export const teacherService = new TeacherService();
export { TeacherService as DefaultAdminTeacherTeacherService };
