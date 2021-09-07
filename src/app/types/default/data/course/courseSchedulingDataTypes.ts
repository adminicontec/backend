// @import types
// @end

// @add your types
export interface IFetchCourseSchedulingByProgram {
  moodle_id: string // Identificador de moodle
  user?: string // Identificador del usuario logueado
  only_user_logged?: boolean // Booleano que indica si se buscara solo la programación del usuario logueado
  sessionStartDate?: {
    date: 'today' | string
    direction: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  } // Fecha de busqueda
}
//@end
