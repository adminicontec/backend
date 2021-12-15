interface IBlockEditorJS{
  style?: any
  data: any,
  type: string
}

class EditorjsService {

  /**
   * @INFO Obtener el html en string a partir de un json del editor js
   * @param blocks
   * @returns
   */
  public jsonToHtml = (blocks: IBlockEditorJS[]) => {
    if(!blocks?.length) return ''
    const response = blocks.reduce((acum: string, item) => {
      acum += this.getHtmlBlock(item)
      return acum
    }, '')
    return response
  }

  /**
   * ! INCOMPLETO
   * @INFO obtener el html STRING de un bloque del editor
   * * Importante: por cada plugin agregado al editor se debe crear un nuevo case para obtener el html de ese bloque
   * @param block
   */
  private getHtmlBlock = (block: IBlockEditorJS) => {
    let response = ''
    if(!block.type) return response
    switch(block.type){
      // Header (h1 ... hn)
      case 'header':
        response = `<h${block.data.level}>${block.data.text}</h${block.data.level}>`
        break;
      // Parágrafo (<p>)
      case 'paragraph':
        response = `<p>${block.data.text}</p>`
        break;
      // Imagen (<img>)
      case 'image':
        response = `<img style='${block.data.withBackground ? 'padding: 30px; background-color: var(--primary);' : ''} width: 100%; ${block.data.withBorder ? 'border: 2px solid var(--primary);' : ''}' src='${block.data.file.url}' alt='${block.data.caption}' />`
        break;
      // Link a web (<div> ... <a>)
      case 'linkTool':
        response = `<a href='${block.data.link}' target='_blank' >${block.data.link}</a>`
        break;
      // Cita (<div> ... <div>)
      case 'quote':
        response =  `<div style='margin: 15px 0px;' >` +
                      `<p style='text-align: ${block.data.alignment}; margin: 0px; padding: 0px;' >${block.data.text}</p>` +
                      `<p style='text-align: ${block.data.alignment}; font-size: 0.8rem; margin: 0px; padding: 0px;' >${block.data.caption}</p>` +
                    `</div>`
        break;
      // Lista ordenada o desordenada (<ol> | <ul>)
      case 'list':
        response = (block.style === 'unordered') ? '<ol>' : '<ul>'
        if (block.data.items) {
          block.data.items.map((item: string) => {
            response += `<li>${item}</li>`
          })
        }
        response += (block.style === 'unordered') ? '</ol>' : '</ul>'
        break;
      // Texto con formato código (<div>)
      case 'raw':
        response = ''
        break;
      // checklist (<input type='radio'>)
      case 'checklist':
        response = ''
        break;
      // Tabla sin header (<table>)
      case 'table':
        response = ''
        break;
      default:
        break;
    }
    return response
  }
}

export default EditorjsService
export const editorjsService = new EditorjsService();
export { EditorjsService as DefaultGeneralEditorjsEditorjsService };
