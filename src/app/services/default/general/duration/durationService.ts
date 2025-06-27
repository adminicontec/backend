// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
// @end

// @import types
// @end

class DurationService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * @INFO Obtener segundos de texto
   * @param inputValue
   */
  getSecondsFromDuration = (inputValue: string) => {
    const auxVector = inputValue.split(' ')
    let seconds: number = 0
    if(auxVector.length){
      auxVector.forEach(item => {
        if(item.includes('d')){
          const days = Number(item.replace('d', ''))
          seconds += days*3600*24
        } else if (item.includes('h')){
          const hours = Number(item.replace('h', ''))
          seconds += hours*3600
        } else if (item.includes('m')){
          const minutes = Number(item.replace('m', ''))
          seconds += minutes*60
        } else if (item.includes('s')){
          seconds += Number(item.replace('s', ''))
        }
      })
    }
    return seconds
  }

  /**
   * @INFO Obtener duración con el formato
   * @param seconds
   */
  getDurationFormated = (seconds: number, format: 'short' | 'large' = 'short') => {
    const days = Math.trunc(seconds / (3600*24))
    const hours = Math.trunc((seconds - (days*3600*24))/ 3600)
    const minutes = Math.trunc((seconds - (days*3600*24) - (hours*3600))/60)
    const seconds2 = Math.trunc(seconds - (days*3600*24) - (hours*3600) - (minutes*60))
    let response: string = ''
    if (days) {
      response = `${response} ${days}${(format === 'short') ? 'd' : ' Días'}`
    }
    if(hours){
        response = `${response} ${hours}${(format === 'short') ? 'h' : ' Horas'}`
    }
    if(minutes){
        response = `${response} ${minutes}${(format === 'short') ? 'm' : ' Minutos'}`
    }
    if(seconds2){
        response = `${response} ${seconds2}${(format === 'short') ? 's' : ' Segundos'}`
    }
    return response
  }

}

export const durationService = new DurationService();
export { DurationService as DefaultGeneralDurationDurationService };
