// @import_dependencies_node Import libraries
import * as fs from 'fs';
import * as path from 'path';
var chokidar = require('chokidar');
// @end

class FileUtility {

  public TARGET_DIRECTORY = 'directory';
  public TARGET_FILE      = 'file';

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  /**
   * Metodo que permite leer un directorio de forma sincrona
   * @param dir_path Ruta del directorio que se desea leer
   * @returns
   */
  public readDirSync = (dir_path) => {
    try {
      return fs.readdirSync(dir_path, {encoding: "utf-8"});
    } catch (e) {
      return null
    }
  }

  /**
   * Metodo que permite ller un archivo de forma sincrona
   * @param file_path Ruta del archivo que se desea leer
   * @returns
   */
  public readFileSync = (file_path) => {
    try {
      return fs.readFileSync(file_path, 'utf-8');
    } catch (e) {
      return null
    }
  }

  /**
   * Metodo que permite eliminar un archivo de forma sincrona
   * @param file_path Ruta del archivo que se desea eliminar
   * @returns
   */
  public removeFileSync = (file_path) => {
    try {
      fs.unlinkSync(file_path);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Metodo que permite escribir en un archivo de forma sincrona
   * @param file_path Ruta del archivo que se desea escribir
   * @param content Contenido del archivo
   * @returns
   */
  public writeFileSync = (file_path, content) => {
    try {
      fs.writeFileSync(file_path,content,'utf-8');
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Metodo que verifica si un archivo existe en una ubicacion especifica
   * @param file_path Ruta absoluta del archivo que se desea verificar
   * @returns [booleano] Boleano
   */
  public fileExists = (file_path) => {
    try {
      return fs.statSync(file_path).isFile();
    } catch (e) {
      return false;
    }
  }

  /**
   * Metodo que verifica si un directorio existe
   * @param dir_path Ruta absoluta del directorio que se desea verificar
   * @returns
   */
  public dirExists = (dir_path) => {
    var exists = false;
    try {
      var source_lstat = fs.lstatSync( dir_path );
      if (source_lstat.isDirectory()) {
        exists = true;
      }
    } catch(err) {}

    return exists;
  }

  /**
   * Metodo que permite crear directorios si no existen de forma recursiva
   * @param dirpath Ruta absoluta que se desea crear
   * @param [sep] Separador de la ruta
   * @param [permissions]  Permisos que se asignaran a los directorios creados
   */
  public createDirRecursive = (dirpath, sep: string = '/', permissions: string = '0744') => {
    var parts = dirpath.split(sep);
    for( var i = 1; i <= parts.length; i++ ) {
      if (typeof parts[i] !== 'undefined' && parts[i] !== '') {
        var hasExtension = this.getFileExtension(parts[i]);
        if (hasExtension == '') {
          var current_path = '/' + path.join.apply(null, parts.slice(0, i)) + '/' + parts[i];

          if (!fs.existsSync(current_path)) {
            fs.mkdirSync( current_path , permissions);
          }
        }
      }
    }
  }

  /**
   * Metodo que permite eliminar directorios y su contenido de forma recursiva
   * @param dir_path Ruta absoluta que se desea eliminar
   */
  public removeDirRecursive = (dir_path, exclude: Array<any> = []) => {

    if( fs.existsSync(dir_path)) {
      fs.readdirSync(dir_path).forEach((file,index) => {
        var current_path = dir_path + '/' + file;

        if (exclude.indexOf(file) === -1) {
          if(fs.statSync(current_path).isDirectory()) { // recurse
            this.removeDirRecursive(current_path,exclude);
          } else { // delete file
            fs.unlinkSync(current_path);
          }
        }
      });

      var basename = path.basename(dir_path);
      if (exclude.indexOf(basename) === -1) {
        fs.rmdirSync(dir_path);
      }
    }
  }

  /**
   * Metodo que permite hacer seguimiento a un directorio o archivo para ver su estado
   * @param path_watch Ruta que se desea observar
   * @returns
   */
  public watch = (path_watch) => {
    return chokidar.watch(path_watch, {ignored: /^\./, persistent: true});
  }

  /**
   * Metodo que permite obtener la extencion de un archivo
   * @param filename Archivo sobre el cual se desea obtener la extension
   * @return Extension del archivo, si no se encuentra una extension retornara vacio ""
   */
  public getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
  }

  /**
   * Metodo que permite copiar recursivamente todo lo que exista en un directorio
   * @param source Ruta absoluta del origen de los archivos
   * @param target Ruta absoluta del destino de los archivos
   * @param [exclude] Archivos a excluir
   * @param [permissions] Permisos para creacion de directorios y archivos
   */
  public copyDirRecursiveSync = (source, target, exclude: Array<any> = [], permissions: string = '0744') => {

    var files = [];

    //check if folder needs to be created or integrated
    var basename = path.basename( source );
    var targetFolder = path.join( target, basename );

    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder , permissions);
    }

    //copy
    try {
      var source_lstat = fs.lstatSync( source );
      if (source_lstat.isDirectory()) {
        files = fs.readdirSync( source );
        files.forEach(( file ) => {
          var curSource = path.join( source, file );
          try {
            var curSource_lstat = fs.lstatSync( curSource );
            if ( curSource_lstat.isDirectory() ) {
              this.copyDirRecursiveSync( curSource, targetFolder, exclude, permissions);
            } else {
              this.copyFileSync( curSource, targetFolder);
            }

          } catch (err) {}
        } );
      }
    } catch(err) {}
  }

  /**
   * Metodo que permite copiar un archivo
   * @param source Ruta absoluta del origen del archivo
   * @param target Ruta absoluta del destino del archivo
   * @param file_name Nombre personalizado del archivo
   */
  public copyFileSync (source, target, file_name: string = null) {

    var targetFile = target;

    //if target is a directory a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
      try {
        var target_lstat = fs.lstatSync( target );
        if ( target_lstat.isDirectory() ) {
          var target_file_name = (file_name) ? file_name : path.basename( source );
          targetFile = path.join( target, target_file_name );
        }
      } catch (err) {}

    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
  }

  /**
   * Metodo que verifica el tipo de elemento que se esta proporcionado
   * @param target Ruta absoluta del elemento que se desea saber su tipo
   * @returns
   */
  public getTargetType = (target) => {

    var target_type = null;

    if ( fs.existsSync( target ) ) {
      try {
        var target_lstat = fs.lstatSync( target );
        if ( target_lstat.isDirectory() ) {
          target_type = this.TARGET_DIRECTORY;
        } else if (target_lstat.isFile() ) {
          target_type = this.TARGET_FILE;
        }
      } catch(err) {}
    }

    return target_type;
  }

}

export const fileUtility = new FileUtility();
export { FileUtility }
