// @import types
// @end

// @add your types
export interface IFetchCourses {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  // postType?: Array<string> // Tipo de publicación
  startDate?: {
    date: 'today' | string
    direction: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  } // Fecha de busqueda: Inicio
  endDate?: {
    date: 'today' | string
    direction: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  } // Fecha de busqueda: finalización

  startPublicationDate?: {
    date: 'today' | string
    direction: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  }
  endPublicationDate?: {
    date: 'today' | string
    direction: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  }
  // courseType?: Array<string> // Lista de ubicaciones
  mode?: string
  sort?: {
    field: string,
    direction: string
  },
  price?: 'free' | 'pay' | 'discount'
  city?: string
  regional?: string
  modular?: string
  highlighted?: boolean
  random?: {
    size?: number
  },
  exclude?: Array<string>,
  new?: boolean
}

export interface IFetchCourse {
  id?: string,
  slug?: string
  generate_pdf?: boolean
}

export interface IGenerateCourseFile {
  id?: string,
  slug?: string
}

export interface IContentEditorJs{
  blocks: any[]
  time: number
  version: string
}

// export interface ICourseComponent {
//   key: string,
//   elementType: 'course' | 'moocs' | 'training' | 'training_v2'
// }
export interface ICourse {
  _id: string,
  duration?: number,
  endDate?: string
  endPublicationDate?: string
  enrollmentDeadline?: string
  enrollment_enabled?: boolean
  extra_info: {
    content?: Array<{category: string, data: any, name: string}>
    coverUrl?: string
    description?: any
    requirements?: any
    competencies?: IContentEditorJs
    focus?: IContentEditorJs
    generalities?: IContentEditorJs
    important_info?: IContentEditorJs
    materials?: IContentEditorJs
    methodology?: IContentEditorJs
    objectives?: IContentEditorJs
  }
  hasCost?: boolean
  priceCOP?: number
  priceUSD?: number
  discount?: number
  endDiscountDate?: string
  program?: {
    code?: string
    name?: string
  },
  schedulingMode?: {
    _id: string,
    name: string
  }
  city?: {
    _id: string,
    name: string
  }
  startDate?: any
  startPublicationDate?:  string
  moodle_id?: string,
  custom_training?: {
    modality?: string;
    city?: string;
    price?: string
    video?: {
      platform?: string;
      url?: string
    }
  }
}
//@end
