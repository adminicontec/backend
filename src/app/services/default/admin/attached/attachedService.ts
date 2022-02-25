// @import_dependencies_node Import libraries
import { v4 as uuidv4 } from 'uuid';
// @end

// @import services
import { attachedCategoryService } from '@scnode_app/services/default/admin/attachedCategory/attachedCategoryService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { uploadService } from '@scnode_core/services/default/global/uploadService'
import { customs } from '@scnode_core/config/globals';
// @end

// @import models
import {Attached} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {IAttached, IAttachedDelete, IAttachedQuery} from '@scnode_app/types/default/admin/attached/attachedTypes'
import { IAttachedCategory } from '@scnode_app/types/default/admin/attachedCategory/attachedCategoryTypes';
// @end

class AttachedService {

  private attached_default_path: string = 'attached';

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite validar si un registro existe segun parametros
   * @param params Filtros para buscar el elemento
   * @returns
   */
   public findBy = async (params: IQueryFind) => {

    try {
      let where = {}
      if (params.where && Array.isArray(params.where)) {
        params.where.map((p) => where[p.field] = p.value)
      }

      let select = 'id category files'
      if (params.query === QueryValues.ALL) {
        let registers = await Attached.find(where).select(select).lean()
        registers = this.processAttached(registers);
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          attachments: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        let register = await Attached.findOne(where).select(select).lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'attached.not_found'})
        register = this.processAttached(register);
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          attached: register
        }})
      }

      return responseUtility.buildResponseFailed('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite insertar/actualizar un registro
   * @param params Elementos a registrar
   * @returns
   */
  public insertOrUpdate = async (params: IAttached) => {

    try {

      // Obtener la categoría
      const categoryResponse: any = await attachedCategoryService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.category}]});
      if (categoryResponse.status === 'error') return categoryResponse;
      const category: IAttachedCategory = categoryResponse.attachedCategory;

      // @INFO: Verificar que se cumplan las configuraciones de la categoría
      if (category && category.config?.limit_files && !category.config.unlimited) {
        const totalFiles = (params.files ? params.files.length : 0) + (params.files_upload ? params.files_upload.length : 0);
        if (totalFiles > category.config.limit_files) {
          return responseUtility.buildResponseFailed('json', null, {error_key: 'attached.limit_files_exceded'})
        }
      }

      // @INFO: Verificar si hay nuevos archivos por subir o si es necesario eliminar un item del listado
      if (params.files_upload && params.files_upload.length) {
        const uploadResponse = await this.uploadFiles(params.files_upload);
        if (Array.isArray(uploadResponse)) {
          params.files = [...params.files ? params.files : [], ...uploadResponse];
        } else {
          return uploadResponse;
        }
      }

      if (params.id) {
        const register: IAttached = await Attached.findOne({_id: params.id})
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'attached.not_found'})

        // @INFO Reemplazar las url de los files en los parámetros
        if (params.files && params.files.length && register.files && register.files.length) {
          params.files.forEach((f, idx) => {
            const fRegister = register.files.find((fr) => fr.uuid === f.uuid);
            if (fRegister) {
              params.files[idx].url = fRegister.url;
            }
          })
        }

        let response: any = await Attached.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true }).lean()

        response = this.processAttached(response);

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            attached: response
          }
        })

      } else {
        let response: any = await Attached.create(params)

        response = this.processAttached(response._doc);

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            attached: response
          }
        })
      }

    } catch (e) {
      console.log(e);
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: IAttachedDelete) => {
    try {
      const find: any = await Attached.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'attached.not_found' })

      await find.delete()

      return responseUtility.buildResponseSuccess('json')
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
  public list = async (filters: IAttachedQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id category files'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if(filters.search){
      const search = filters.search
      where = {
        ...where,
        $or:[
          {name: { $regex: '.*' + search + '.*',$options: 'i' }},
          {description: { $regex: '.*' + search + '.*',$options: 'i' }},
        ]
      }
    }

    let registers: IAttached[] = []
    try {
      registers =  await Attached.find(where)
      .select(select)
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
      .lean()
    } catch (e) {}

    registers = this.processAttached(registers) as IAttached[]

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        attachments: [
          ...registers
        ],
        total_register: (paging) ? await Attached.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  /**
   * @INFO Subir archivos masivos al servidor
   * @param files
   */
  private uploadFiles = async (files: any[]): Promise<IAttached['files'] | object> => {
    let response: IAttached['files'] = [];
    if (files && files.length) {
      for await (let file of files) {
        const uploadResponse: any = await uploadService.uploadFile(file, this.attached_default_path);
        if (uploadResponse.status === 'error') return uploadResponse;
        if (uploadResponse.hasOwnProperty('name'))
        response.push({
          url: uploadResponse.name,
          uuid: uuidv4(),
          unique: uuidv4()
        });
      }
    }
    return response;
  }

  /**
   * @INFO Procesar la data de los adjuntos
   * @param attached
   */
  private processAttached = (attached: IAttached | IAttached[]): IAttached | IAttached[] => {
    if (Array.isArray(attached)) {
      const newAttachments: IAttached[] = [];
      attached.forEach((a) => {
        const newAttached: IAttached = {...a};
        if (newAttached.files && newAttached.files.length) {
          const files = [...newAttached.files];
          const newFiles: IAttached['files'] = []
          files.forEach((file) => {
            const newFile = {
              ...file,
              url: this.getFileUrl(file.url)
            };
            newFiles.push(newFile);
          })
          newAttached.files = newFiles;
        }
        newAttachments.push(newAttached);
      })
      return newAttachments;
    } else {
      const newAttached = {...attached};
      if (newAttached.files && newAttached.files.length) {
        const files = [...newAttached.files];
        const newFiles: IAttached['files'] = []
        files.forEach((file) => {
          const newFile = {
            ...file,
            url: this.getFileUrl(file.url)
          };
          newFiles.push(newFile);
        })
        newAttached.files = newFiles;
      }
      return newAttached;
    }
  }

  /**
   * @INFO Obtener la url completa de un file
   * @param key
   */
  public getFileUrl = (key: string) => {
    return `${customs['uploads']}/${this.attached_default_path}/${key}`;
  }

}

export const attachedService = new AttachedService();
export { AttachedService as DefaultAdminAttachedAttachedService };
