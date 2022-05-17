// @import types
// @end

// @add your types
export interface IAssociationsByCourseScheduling {
  user: string;
  course_scheduling: string;
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
}

export interface IAssociation {
  _id?: string;
  unique?: string;
  slug: string;
}

export interface IAssociateSchedules {
  user: string;
  course_scheduling: string;
  masterGroup?: string;
  associations?: IAssociation[]
}

export enum AssociationType {
  PARENT = 'parent',
  CHILD = 'child'
}

export interface IModelAssociation {
  generatingAssociation?: boolean;
  associationType?: AssociationType;
  parent?: string;
  date?: string;
  personWhoGeneratedAssociation?: string;
  slug?: string
}
//@end
