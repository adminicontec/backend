// @import_services Import Services
import { DefaultPluginsSeederSeederService } from "@scnode_core/services/default/plugins/seeder/seederService";
// @end

// @import_models Import models
// @end

// @import services
import {appModulePermissionService} from '@scnode_app/services/default/admin/secure/appModule/appModulePermissionService'
import {appModuleService} from '@scnode_app/services/default/admin/secure/appModule/appModuleService'
import {roleService} from '@scnode_app/services/default/admin/secure/roleService'
import {userService} from '@scnode_app/services/default/admin/user/userService'
import {homeService} from '@scnode_app/services/default/admin/home/homeService'
import {countryService} from '@scnode_app/services/default/admin/country/countryService'

import {postTypeService} from '@scnode_app/services/default/admin/post/postTypeService'
import {postLocationService} from '@scnode_app/services/default/admin/post/postLocationService'

import {forumLocationService} from '@scnode_app/services/default/admin/forum/forumLocationService'

import {courseModeCategoryService} from '@scnode_app/services/default/admin/course/courseModeCategoryService'
import {regionalService} from '@scnode_app/services/default/admin/regional/regionalService'
import {courseSchedulingModeService} from '@scnode_app/services/default/admin/course/courseSchedulingModeService'
import {courseSchedulingStatusService} from '@scnode_app/services/default/admin/course/courseSchedulingStatusService'
import {courseSchedulingTypeService} from '@scnode_app/services/default/admin/course/courseSchedulingTypeService'
// @end

// @import_utilitites Import utilities
// @end

// @import_types Import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
// @end

class InitSeeder extends DefaultPluginsSeederSeederService {

  /**
   * Metodo que contiene la logica del seeder
   * @return Booleano que identifica si se pudo o no ejecutar el Seeder
   */
  public run = async () => {
    // @seeder_logic Add seeder logic

    // @INFO: Agregando ciudades
    let country_ids = await this.addCountries()

    // @INFO: Agregando homes
    let home_ids = await this.addHomes()

    // @INFO: Agregando modulos y permisos
    let {module_ids, module_permission_ids} = await this.addAppModulesAndPermissions()

    // @INFO: Agregando roles
    let role_ids = await this.addRoles(module_permission_ids, home_ids)

    // @INFO: Agregando usuarios
    let user_ids = await this.addUsers(role_ids)

    // @INFO: Agregando tipos de publicaciones
    let post_type_ids = await this.addPostTypes()

    // @INFO: Agregando tipos de ubicaciones
    let post_location_ids = await this.addPostLocations()

    // @INFO: Agregando modos de cursos
    let course_mode_ids = await this.addCourseModesCategories()

    // @INFO: Agregando regionales
    let regional_ids = await this.addRegionals()

    // @INFO: Agregando estados de programación
    let scheduling_status_ids = await this.addCourseSchedulingStatuses()

    // @INFO: Agregando tipos de programación
    let scheduling_type_ids = await this.addCourseSchedulingTypes()

    // @INFO: Agregando modos de programación
    let scheduling_mode_ids = await this.addCourseSchedulingModes()

    // TODO: Agregar PostCategories

    // TODO: Agregar entornos

    // @INFO: Agregando tipos de ubicaciones
    let forum_location_ids = await this.addForumLocations()

    return false; // Always return true | false
  }

  // @add_more_methods

  /**
   * Metodo que permite agregar ciudades
   * @returns
   */
  private addCountries = async () => {
    let country_ids = {}
    const countries = [
      { name: "Colombia", iso2: "CO", iso3: "COL" },
      { name: "Andorra", iso2: "AD", iso3: "AND" },
      { name: "Emiratos Árabes Unidos", iso2: "AE", iso3: "ARE" },
      { name: "Afganistán", iso2: "AF", iso3: "AFG" },
      { name: "Antigua y Barbuda", iso2: "AG", iso3: "ATG" },
      { name: "Anguila", iso2: "AI", iso3: "AIA" },
      { name: "Albania", iso2: "AL", iso3: "ALB" },
      { name: "Albania", iso2: "AL", iso3: "ALB" },
      { name: "Armenia", iso2: "AM", iso3: "ARM" },
      { name: "Antillas Holandesas", iso2: "AN", iso3: "ANT" },
      { name: "Angola", iso2: "AO", iso3: "AGO" },
      { name: "Antártida", iso2: "AQ", iso3: "ATA" },
      { name: "Argentina", iso2: "AR", iso3: "ARG" },
      { name: "Samoa Americana", iso2: "AS", iso3: "ASM" },
      { name: "Austria", iso2: "AT", iso3: "AUT" },
      { name: "Australia", iso2: "AU", iso3: "AUS" },
      { name: "Aruba", iso2: "AW", iso3: "ABW" },
      { name: "Islas Aland", iso2: "AX", iso3: "ALA" },
      { name: "Azerbaiyán", iso2: "AZ", iso3: "AZE" },
      { name: "Bosnia y Herzegovina", iso2: "BA", iso3: "BIH" },
      { name: "Barbados", iso2: "BB", iso3: "BRB" },
      { name: "Bangladesh", iso2: "BD", iso3: "BGD" },
      { name: "Bélgica", iso2: "BE", iso3: "BEL" },
      { name: "Burkina Faso", iso2: "BF", iso3: "BFA" },
      { name: "Bulgaria", iso2: "BG", iso3: "BGR" },
      { name: "Bahrein", iso2: "BH", iso3: "BHR" },
      { name: "Burundi", iso2: "BI", iso3: "BDI" },
      { name: "Benín", iso2: "BJ", iso3: "BEN" },
      { name: "Bermudas", iso2: "BM", iso3: "BMU" },
      { name: "Brunei", iso2: "BN", iso3: "BRN" },
      { name: "Bolivia", iso2: "BO", iso3: "BOL" },
      { name: "Brasil", iso2: "BR", iso3: "BRA" },
      { name: "Bahamas", iso2: "BS", iso3: "BHS" },
      { name: "Bután", iso2: "BT", iso3: "BTN" },
      { name: "Isla Bouvet", iso2: "BV", iso3: "BVT" },
      { name: "Botswana", iso2: "BW", iso3: "BWA" },
      { name: "Bielorusia", iso2: "BY", iso3: "BLR" },
      { name: "Belice", iso2: "BZ", iso3: "BLZ" },
      { name: "Canadá", iso2: "CA", iso3: "CAN" },
      { name: "Islas Cocos", iso2: "CC", iso3: "CCK" },
      { name: "Republica Democrática del Congo", iso2: "CD", iso3: "COD" },
      { name: "República Centrofricana", iso2: "CF", iso3: "CAF" },
      { name: "República del Congo", iso2: "CG", iso3: "COG" },
      { name: "Suiza", iso2: "CH", iso3: "CHE" },
      { name: "Costa de Marfil", iso2: "CI", iso3: "CIV" },
      { name: "Islas Cook", iso2: "CK", iso3: "COK" },
      { name: "Chile", iso2: "CL", iso3: "CHL" },
      { name: "Camerún", iso2: "CM", iso3: "CMR" },
      { name: "China", iso2: "CN", iso3: "CHN" },
      { name: "Costa Rica", iso2: "CR", iso3: "CRI" },
      { name: "Cuba", iso2: "CU", iso3: "CUB" },
      { name: "Cabo Verde", iso2: "CV", iso3: "CPV" },
      { name: "Isla de Navidad", iso2: "CX", iso3: "CXR" },
      { name: "Chipre", iso2: "CY", iso3: "CYP" },
      { name: "República Checa", iso2: "CZ", iso3: "CZE" },
      { name: "Alemania", iso2: "DE", iso3: "DEU" },
      { name: "Yibuti", iso2: "DJ", iso3: "DJI" },
      { name: "Dinamarca", iso2: "DK", iso3: "DNK" },
      { name: "Dominica", iso2: "DM", iso3: "DMA" },
      { name: "República Dominicana", iso2: "DO", iso3: "DOM" },
      { name: "Argelia", iso2: "DZ", iso3: "DZA" },
      { name: "Ecuador", iso2: "EC", iso3: "ECU" },
      { name: "Estonia", iso2: "EE", iso3: "EST" },
      { name: "Egipto", iso2: "EG", iso3: "EGY" },
      { name: "Sahara Occidental", iso2: "EH", iso3: "ESH" },
      { name: "Eritrea", iso2: "ER", iso3: "ERI" },
      { name: "España", iso2: "ES", iso3: "ESP" },
      { name: "Etiopía", iso2: "ET", iso3: "ETH" },
      { name: "Finlandia", iso2: "FI", iso3: "FIN" },
      { name: "Fiji", iso2: "FJ", iso3: "FJI" },
      { name: "Islas Malvinas", iso2: "FK", iso3: "FLK" },
      { name: "Micronesia", iso2: "FM", iso3: "FSM" },
      { name: "Islas Faroe", iso2: "FO", iso3: "FRO" },
      { name: "Francia", iso2: "FR", iso3: "FRA" },
      { name: "Gabón", iso2: "GA", iso3: "GAB" },
      { name: "Reino Unido", iso2: "GB", iso3: "GBR" },
      { name: "Granada", iso2: "GD", iso3: "GRD" },
      { name: "Georgia", iso2: "GE", iso3: "GEO" },
      { name: "Guayana Francesa", iso2: "GF", iso3: "GUF" },
      { name: "Guernsey", iso2: "GG", iso3: "GGY" },
      { name: "Ghana", iso2: "GH", iso3: "GHA" },
      { name: "Gibraltar", iso2: "GI", iso3: "GIB" },
      { name: "Groenlandia", iso2: "GL", iso3: "GRL" },
      { name: "Gambia", iso2: "GM", iso3: "GMB" },
      { name: "Guinea", iso2: "GN", iso3: "GIN" },
      { name: "Guadalupe", iso2: "GP", iso3: "GLP" },
      { name: "Guinea Ecuatorial", iso2: "GQ", iso3: "GNQ" },
      { name: "Grecia", iso2: "GR", iso3: "GRC" },
      { name: "Georgia del Sur y las islas Sandwich", iso2: "GS", iso3: "SGS" },
      { name: "Guatemala", iso2: "GT", iso3: "GTM" },
      { name: "Guam", iso2: "GU", iso3: "GUM" },
      { name: "Guinea-Bissau", iso2: "GW", iso3: "GNB" },
      { name: "Guyana", iso2: "GY", iso3: "GUY" },
      { name: "Hong Kong", iso2: "HK", iso3: "HKG" },
      { name: "Islas Heard y McDonald", iso2: "HM", iso3: "HMD" },
      { name: "Honduras", iso2: "HN", iso3: "HND" },
      { name: "Croacia", iso2: "HR", iso3: "HRV" },
      { name: "Haití", iso2: "HT", iso3: "HTI" },
      { name: "Hungría", iso2: "HU", iso3: "HUN" },
      { name: "Indonesia", iso2: "ID", iso3: "IDN" },
      { name: "Irlanda", iso2: "IE", iso3: "IRL" },
      { name: "Israel", iso2: "IL", iso3: "ISR" },
      { name: "Isla de Man", iso2: "IM", iso3: "IMN" },
      { name: "India", iso2: "IN", iso3: "IND" },
      { name: "Terrirorio Británico del Océano Índico", iso2: "IO", iso3: "IOT" },
      { name: "Irak", iso2: "IQ", iso3: "IRQ" },
      { name: "Irán", iso2: "IR", iso3: "IRN" },
      { name: "Islandia", iso2: "IS", iso3: "ISL" },
      { name: "Italia", iso2: "IT", iso3: "ITA" },
      { name: "Jersey", iso2: "JE", iso3: "JEY" },
      { name: "Jamaica", iso2: "JM", iso3: "JAM" },
      { name: "Jordania", iso2: "JO", iso3: "JOR" },
      { name: "Japón", iso2: "JP", iso3: "JPN" },
      { name: "Kenia", iso2: "KE", iso3: "KEN" },
      { name: "Kirguistán", iso2: "KG", iso3: "KGZ" },
      { name: "Camboya", iso2: "KH", iso3: "KHM" },
      { name: "Kiribati", iso2: "KI", iso3: "KIR" },
      { name: "Comoras", iso2: "KM", iso3: "COM" },
      { name: "San Cristóbal y Nieves", iso2: "KN", iso3: "KNA" },
      { name: "República Democrática de Corea", iso2: "KP", iso3: "PRK" },
      { name: "República de Corea", iso2: "KR", iso3: "KOR" },
      { name: "Kuwait", iso2: "KW", iso3: "KWT" },
      { name: "Islas Caimán", iso2: "KY", iso3: "CYM" },
      { name: "Kasajistán", iso2: "KZ", iso3: "KAZ" },
      { name: "Laos", iso2: "LA", iso3: "LAO" },
      { name: "Líbano", iso2: "LB", iso3: "LBN" },
      { name: "Santa Lucía", iso2: "LC", iso3: "LCA" },
      { name: "Liechtenstein", iso2: "LI", iso3: "LIE" },
      { name: "Sri Lanka", iso2: "LK", iso3: "LKA" },
      { name: "Liberia", iso2: "LR", iso3: "LBR" },
      { name: "Lesotho", iso2: "LS", iso3: "LSO" },
      { name: "Lituana", iso2: "LT", iso3: "LTU" },
      { name: "Luxembur ", iso2: "LU", iso3: "LUX" },
      { name: "Letonia", iso2: "LV", iso3: "LVA" },
      { name: "Libia", iso2: "LY", iso3: "LBY" },
      { name: "Marruecos", iso2: "MA", iso3: "MAR" },
      { name: "Mónaco", iso2: "MC", iso3: "MCO" },
      { name: "Moldavia", iso2: "MD", iso3: "MDA" },
      { name: "Montenegro", iso2: "ME", iso3: "MNE" },
      { name: "Madagascar", iso2: "MG", iso3: "MDG" },
      { name: "Islas Marschall", iso2: "MH", iso3: "MHL" },
      { name: "Macedonia", iso2: "MK", iso3: "MKD" },
      { name: "Malí", iso2: "ML", iso3: "MLI" },
      { name: "Myanmar", iso2: "MM", iso3: "MMR" },
      { name: "Mon lia", iso2: "MN", iso3: "MNG" },
      { name: "Macao", iso2: "MO", iso3: "MAC" },
      { name: "Islas Marianas del Norte", iso2: "MP", iso3: "MNP" },
      { name: "Martinica", iso2: "MQ", iso3: "MTQ" },
      { name: "Mauritania", iso2: "MR", iso3: "MRT" },
      { name: "Montserrat", iso2: "MS", iso3: "MSR" },
      { name: "Malta", iso2: "MT", iso3: "MLT" },
      { name: "Mauricio", iso2: "MU", iso3: "MUS" },
      { name: "Maldivas", iso2: "MV", iso3: "MDV" },
      { name: "Malawi", iso2: "MW", iso3: "MWI" },
      { name: "México", iso2: "MX", iso3: "MEX" },
      { name: "Malasia", iso2: "MY", iso3: "MYS" },
      { name: "Mozambique", iso2: "MZ", iso3: "MOZ" },
      { name: "Namibia", iso2: "NA", iso3: "NAM" },
      { name: "Nueva Caledonia", iso2: "NC", iso3: "NCL" },
      { name: "Níger", iso2: "NE", iso3: "NER" },
      { name: "Isla Norfolk", iso2: "NF", iso3: "NFK" },
      { name: "Nigeria", iso2: "NG", iso3: "NGA" },
      { name: "Nicaragua", iso2: "NI", iso3: "NIC" },
      { name: "Países Bajos", iso2: "NL", iso3: "NLD" },
      { name: "Noruega", iso2: "NO", iso3: "NOR" },
      { name: "Nepal", iso2: "NP", iso3: "NPL" },
      { name: "Naurú", iso2: "NR", iso3: "NRU" },
      { name: "Niue", iso2: "NU", iso3: "NIU" },
      { name: "Nueva Zelanda", iso2: "NZ", iso3: "NZL" },
      { name: "Omán", iso2: "OM", iso3: "OMN" },
      { name: "Panamá", iso2: "PA", iso3: "PAN" },
      { name: "Perú", iso2: "PE", iso3: "PER" },
      { name: "Polinesia Francesa", iso2: "PF", iso3: "PYF" },
      { name: "Papúa-Nueva Guinea", iso2: "PG", iso3: "PNG" },
      { name: "Filipinas", iso2: "PH", iso3: "PHL" },
      { name: "Pakistán", iso2: "PK", iso3: "PAK" },
      { name: "Polonia", iso2: "PL", iso3: "POL" },
      { name: "San Pedro y Miquelón", iso2: "PM", iso3: "SPM" },
      { name: "Pitcairn", iso2: "PN", iso3: "PCN" },
      { name: "Puerto Rico", iso2: "PR", iso3: "PRI" },
      { name: "Estado de Palestina", iso2: "PS", iso3: "PSE" },
      { name: "Portugal", iso2: "PT", iso3: "PRT" },
      { name: "Palau", iso2: "PW", iso3: "PLW" },
      { name: "Paraguay", iso2: "PY", iso3: "PRY" },
      { name: "Qatar", iso2: "QA", iso3: "QAT" },
      { name: "Reunión", iso2: "RE", iso3: "REU" },
      { name: "Rumania", iso2: "RO", iso3: "ROM" },
      { name: "Serbia", iso2: "RS", iso3: "SRB" },
      { name: "Rusia", iso2: "RU", iso3: "RUS" },
      { name: "Ruanda", iso2: "RW", iso3: "RWA" },
      { name: "Arabia Saudita", iso2: "SA", iso3: "SAU" },
      { name: "Islas Salomón", iso2: "SB", iso3: "SLB" },
      { name: "Seychelles", iso2: "SC", iso3: "SYC" },
      { name: "Sudán", iso2: "SD", iso3: "SDN" },
      { name: "Suecia", iso2: "SE", iso3: "SWE" },
      { name: "Singapur", iso2: "SG", iso3: "SGP" },
      { name: "Santa Helena", iso2: "SH", iso3: "SHN" },
      { name: "Eslovenia", iso2: "SI", iso3: "SVN" },
      { name: "Svalbard y Jan Mayen", iso2: "SJ", iso3: "SJM" },
      { name: "Eslovaquia", iso2: "SK", iso3: "SVK" },
      { name: "Sierra Leona", iso2: "SL", iso3: "SLE" },
      { name: "San Marino", iso2: "SM", iso3: "SMR" },
      { name: "Senegal", iso2: "SN", iso3: "SEN" },
      { name: "Somalia", iso2: "SO", iso3: "SOM" },
      { name: "Surinam", iso2: "SR", iso3: "SUR" },
      { name: "Santo Tomé y Príncipe", iso2: "ST", iso3: "STP" },
      { name: "El Salvador", iso2: "SV", iso3: "SLV" },
      { name: "Siria", iso2: "SY", iso3: "SYR" },
      { name: "Swazilandia", iso2: "SZ", iso3: "SWZ" },
      { name: "Isla Turks y Caicos", iso2: "TC", iso3: "TCA" },
      { name: "Chad", iso2: "TD", iso3: "TCD" },
      { name: "Territorios Franceses del Sur", iso2: "TF", iso3: "ATF" },
      { name: "Togo", iso2: "TG", iso3: "TGO" },
      { name: "Tailandia", iso2: "TH", iso3: "THA" },
      { name: "Tajikistán", iso2: "TJ", iso3: "TJK" },
      { name: "Tokelau", iso2: "TK", iso3: "TKL" },
      { name: "Timor Este", iso2: "TL", iso3: "TKM" },
      { name: "Turkmenistán", iso2: "TM", iso3: "TUN" },
      { name: "Tunicia", iso2: "TN", iso3: "TON" },
      { name: "Tonga", iso2: "TO", iso3: "TMP" },
      { name: "Turquía", iso2: "TR", iso3: "TUR" },
      { name: "Trinidad y Toba ", iso2: "TT", iso3: "TTO" },
      { name: "Tuvalú", iso2: "TV", iso3: "TUV" },
      { name: "Taiwán", iso2: "TW", iso3: "TWN" },
      { name: "Tanzania", iso2: "TZ", iso3: "TZA" },
      { name: "Ucrania", iso2: "UA", iso3: "UKR" },
      { name: "Uganda", iso2: "UG", iso3: "UGA" },
      { name: "Islas Menores de Estados Unidos", iso2: "UM", iso3: "UMI" },
      { name: "Estados Unidos", iso2: "US", iso3: "USA" },
      { name: "Uruguay", iso2: "UY", iso3: "URY" },
      { name: "Uzbekistán", iso2: "UZ", iso3: "UZB" },
      { name: "El Vaticano", iso2: "VA", iso3: "VAT" },
      { name: "San Vicente y Granadinas", iso2: "VC", iso3: "VCT" },
      { name: "Venezuela", iso2: "VE", iso3: "VEN" },
      { name: "Islas Vírgenes Británicas", iso2: "VG", iso3: "VGB" },
      { name: "Islas Vírgenes de Estados Unidos", iso2: "VI", iso3: "VIR" },
      { name: "Vietnam", iso2: "VN", iso3: "VNM" },
      { name: "Vanuatu", iso2: "VU", iso3: "VUT" },
      { name: "Wallis y Futuna", iso2: "WF", iso3: "WLF" },
      { name: "Samoa", iso2: "WS", iso3: "WSM" },
      { name: "Yemén", iso2: "YE", iso3: "YEM" },
      { name: "Mayotte", iso2: "YT", iso3: "MYT" },
      { name: "Suráfrica", iso2: "ZA", iso3: "ZAF" },
      { name: "Zambia", iso2: "ZM", iso3: "ZMB" },
      { name: "Zimbabwe", iso2: "ZW", iso3: "ZWE" }
    ]

    for await (const country of countries) {
      const exists: any = await countryService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: country.name}]
      })
      if (exists.status === 'success') country['id'] = exists.country._id

      const response: any = await countryService.insertOrUpdate(country)
      if (response.status === 'success') {
        country_ids[country.name] = response.country._id
      }
    }
    return country_ids
  }

  /**
   * Metodo que permite agregar homes para los usuarios
   * @returns
   */
  private addHomes = async () => {

    let home_ids = {}

    const homes = [
      {name: 'student', description: 'Home destinado para estudiantes'},
      {name: 'teacher', description: 'Home destinado para docentes'},
      {name: 'admin', description: 'Home destinado para administradores'},
    ]

    for await (const home of homes) {
      const exists: any = await homeService.findBy({
        query: QueryValues.ONE,
        where: [{ field: 'name', value: home.name }]
      })
      if (exists.status === 'success') home['id'] = exists.home._id

      const register: any = await homeService.insertOrUpdate(home)
      if (register.status === 'success') {
          home_ids[register.home.name] = register.home._id
      }
    }

    return home_ids
  }

  /**
   * Metodo que permite agregar modulos y permisos
   * @returns
   */
  private addAppModulesAndPermissions = async () => {

    let module_ids = {}
    let module_permission_ids = {}

    const modules = [
      {
        name: 'global_permissions', description: 'Este modulo contiene los permisos globales', permissions: [
          { name: 'config:is_teacher', description: 'Permiso que identifica a los docentes dentro del campus' },
          { name: 'config:is_student', description: 'Permiso que identifica a los estudiantes dentro del campus' },
          { name: 'config:go_to_campus', description: 'Permiso que permite dar acceso al campus' },
          { name: 'config:go_to_moodle', description: 'Permiso que permite dar acceso al moodle' },
        ]
      },
      {name: 'module:companies', description: 'Módulo que permite administrar las compañias', permissions: [
        {name: 'permission:companies_create', description: 'Crear compañias'},
        {name: 'permission:companies_update', description: 'Editar compañias'},
        {name: 'permission:companies_delete', description: 'Eliminar compañias'},
        {name: 'permission:companies_list', description: 'Ver compañias'},
        {name: 'permission:companies_viewer', description: 'Consultar compañias'},
        {name: 'permission:companies_menu_access', description: 'Menu de compañias'},
      ]},
      {name: 'module:posts', description: 'Módulo que permite administrar las publicaciones', permissions: [
        {name: 'permission:posts_create', description: 'Crear publicaciones'},
        {name: 'permission:posts_update', description: 'Editar publicaciones'},
        {name: 'permission:posts_delete', description: 'Eliminar publicaciones'},
        {name: 'permission:posts_list', description: 'Ver publicaciones'},
        {name: 'permission:posts_viewer', description: 'Consultar publicaciones'},
        {name: 'permission:posts_menu_access', description: 'Menu de publicaciones'},
      ]},
      {name: 'module:banners', description: 'Módulo que permite administrar los banners', permissions: [
        {name: 'permission:banners_create', description: 'Crear banners'},
        {name: 'permission:banners_update', description: 'Editar banners'},
        {name: 'permission:banners_delete', description: 'Eliminar banners'},
        {name: 'permission:banners_list', description: 'Ver banners'},
        {name: 'permission:banners_viewer', description: 'Consultar banners'},
        {name: 'permission:banners_menu_access', description: 'Menu de banners'},
      ]},
      { name: 'module:forums', description: 'Módulo que permite administrar los foros', permissions: [
        {name: 'permission:forums_create', description: 'Crear foros' },
        {name: 'permission:forums_update', description: 'Editar foros' },
        {name: 'permission:forums_delete', description: 'Eliminar foros' },
        {name: 'permission:forums_list', description: 'Ver foros' },
        {name: 'permission:forums_viewer', description: 'Consultar foros' },
        {name: 'permission:forums_menu_access', description: 'Menu de foros'},
      ] },
      {name: 'module:users', description: 'Módulo que permite administrar los usuarios', permissions: [
        {name: 'permission:users_create', description: 'Crear usuarios'},
        {name: 'permission:users_update', description: 'Editar usuarios'},
        {name: 'permission:users_delete', description: 'Eliminar usuarios'},
        {name: 'permission:users_list', description: 'Ver usuarios'},
        {name: 'permission:users_viewer', description: 'Consultar usuarios'},
        {name: 'permission:users_menu_access', description: 'Menu de usuarios'},
      ]},
      {name: 'module:roles', description: 'Módulo que permite administrar los roles', permissions: [
        {name: 'permission:roles_create', description: 'Crear roles'},
        {name: 'permission:roles_update', description: 'Editar roles'},
        {name: 'permission:roles_delete', description: 'Eliminar roles'},
        {name: 'permission:roles_list', description: 'Ver roles'},
        {name: 'permission:roles_viewer', description: 'Consultar roles'},
        {name: 'permission:roles_menu_access', description: 'Menu de roles'},
      ]},
      {name: 'module:modules', description: 'Módulo que permite administrar los modulos', permissions: [
        {name: 'permission:modules_create', description: 'Crear modulos'},
        {name: 'permission:modules_update', description: 'Editar modulos'},
        {name: 'permission:modules_delete', description: 'Eliminar modulos'},
        {name: 'permission:modules_list', description: 'Ver modulos'},
        {name: 'permission:modules_viewer', description: 'Consultar modulos'},
      ]},
      {name: 'module:countries', description: 'Módulo que permite administrar las ciudades', permissions: [
        {name: 'permission:countries_create', description: 'Crear ciudades'},
        {name: 'permission:countries_update', description: 'Editar ciudades'},
        {name: 'permission:countries_delete', description: 'Eliminar ciudades'},
        {name: 'permission:countries_list', description: 'Ver ciudades'},
        {name: 'permission:countries_viewer', description: 'Consultar ciudades'},
      ]},
      {name: 'module:courses', description: 'Módulo que permite administrar las cursos', permissions: [
        {name: 'permission:courses_create', description: 'Crear cursos'},
        {name: 'permission:courses_update', description: 'Editar cursos'},
        {name: 'permission:courses_delete', description: 'Eliminar cursos'},
        {name: 'permission:courses_list', description: 'Ver cursos'},
        {name: 'permission:courses_viewer', description: 'Consultar cursos'},
        {name: 'permission:courses_menu_access', description: 'Menu de cursos'},
      ]},
      {name: 'module:course_scheduling', description: 'Módulo que permite administrar los programas', permissions: [
        {name: 'permission:course_scheduling_create', description: 'Crear programas'},
        {name: 'permission:course_scheduling_update', description: 'Editar programas'},
        {name: 'permission:course_scheduling_delete', description: 'Eliminar programas'},
        {name: 'permission:course_scheduling_list', description: 'Ver programas'},
        {name: 'permission:course_scheduling_viewer', description: 'Consultar programas'},
        {name: 'permission:course_scheduling_menu_access', description: 'Menu de programas'},
      ]},
      {name: 'module:modular', description: 'Módulo que permite administrar los modulares', permissions: [
        {name: 'permission:modular_create', description: 'Crear modulares'},
        {name: 'permission:modular_update', description: 'Editar modulares'},
        {name: 'permission:modular_delete', description: 'Eliminar modulares'},
        {name: 'permission:modular_list', description: 'Ver modulares'},
        {name: 'permission:modular_viewer', description: 'Consultar modulares'},
        {name: 'permission:modular_menu_access', description: 'Menu de modulares'},
      ]},
    ]

    for await (const m of modules) {
      let permissions = []

      for await (const p of m.permissions) {
        const exists: any = await appModulePermissionService.findBy({
          query: QueryValues.ONE,
          where: [{field: 'name', value: p.name}]
        })
        if (exists.status === 'success') p['id'] = exists.appModulePermission._id

        const response: any = await appModulePermissionService.insertOrUpdate(p)
        if (response.status === 'success') {
          permissions.push(response.appModulePermission._id)
          module_permission_ids[p.name] = response.appModulePermission._id
        }
      }

      m['app_module_permissions'] = permissions;

      const exists: any = await appModuleService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: m.name}]
      })
      if (exists.status === 'success') m['id'] = exists.appModule._id

      const module:any = await appModuleService.insertOrUpdate(m)
      if (module.status === 'success') {
        module_ids[m.name] = module.appModule._id
      }
    }

    return {
      module_ids,
      module_permission_ids
    }
  }

  /**
   * Metodo quer permite agregar roles
   * @param module_permission_ids
   * @returns
   */
  private addRoles = async (module_permission_ids, home_ids) => {

    let roles_ids = {}
    const roles = [
      {
        name: 'admin',
        description: 'Administrador del sistema',
        app_module_permissions: [
          module_permission_ids['permission:posts_create'],
          module_permission_ids['permission:posts_update'],
          module_permission_ids['permission:posts_delete'],
          module_permission_ids['permission:posts_list'],
          module_permission_ids['permission:banners_create'],
          module_permission_ids['permission:banners_update'],
          module_permission_ids['permission:banners_delete'],
          module_permission_ids['permission:banners_list'],
          module_permission_ids['permission:forums_create'],
          module_permission_ids['permission:forums_update'],
          module_permission_ids['permission:forums_delete'],
          module_permission_ids['permission:forums_list'],
          module_permission_ids['permission:users_create'],
          module_permission_ids['permission:users_update'],
          module_permission_ids['permission:users_delete'],
          module_permission_ids['permission:users_list'],
          module_permission_ids['permission:roles_create'],
          module_permission_ids['permission:roles_update'],
          module_permission_ids['permission:roles_delete'],
          module_permission_ids['permission:roles_list'],
          module_permission_ids['permission:modules_create'],
          module_permission_ids['permission:modules_update'],
          module_permission_ids['permission:modules_delete'],
          module_permission_ids['permission:modules_list'],
          module_permission_ids['permission:countries_create'],
          module_permission_ids['permission:countries_update'],
          module_permission_ids['permission:countries_delete'],
          module_permission_ids['permission:countries_list'],
          module_permission_ids['permission:courses_create'],
          module_permission_ids['permission:courses_update'],
          module_permission_ids['permission:courses_delete'],
          module_permission_ids['permission:course_scheduling_list'],
          module_permission_ids['permission:course_scheduling_create'],
          module_permission_ids['permission:course_scheduling_update'],
          module_permission_ids['permission:course_scheduling_delete'],
          module_permission_ids['permission:course_scheduling_list'],
          module_permission_ids['permission:companies_create'],
          module_permission_ids['permission:companies_update'],
          module_permission_ids['permission:companies_delete'],
          module_permission_ids['permission:companies_list'],
          module_permission_ids['permission:modular_create'],
          module_permission_ids['permission:modular_update'],
          module_permission_ids['permission:modular_delete'],
          module_permission_ids['permission:modular_list'],

          module_permission_ids['permission:posts_menu_access'],
          module_permission_ids['permission:banners_menu_access'],
          module_permission_ids['permission:forums_menu_access'],
          module_permission_ids['permission:users_menu_access'],
          module_permission_ids['permission:roles_menu_access'],
          module_permission_ids['permission:companies_menu_access'],
          module_permission_ids['permission:courses_menu_access'],
          module_permission_ids['permission:course_scheduling_menu_access'],
          module_permission_ids['permission:modular_menu_access'],
        ],
        homes: [
          home_ids['admin']
        ],
        moodle_id: 1
      },
      {
        name: 'student',
        description: 'Estudiante',
        app_module_permissions: [
          module_permission_ids['config:is_student'],
          module_permission_ids['config:go_to_campus'],
          module_permission_ids['config:go_to_moodle'],
        ],
        homes: [
          home_ids['student']
        ],
        moodle_id: 5
      },
      {
        name: 'teacher',
        description: 'Docente',
        app_module_permissions: [
          module_permission_ids['config:is_teacher'],
        ],
        homes: [
          home_ids['teacher']
        ],
        moodle_id: 4
      },
      {
        name: 'Tutor',
        description: 'Encargado de crear y modificar la programación de servicios educativos.',
        app_module_permissions: [
          module_permission_ids['config:is_teacher'],
        ],
        homes: [
          home_ids['teacher']
        ],
        moodle_id: 4
      },
      {
        name: 'viewer',
        description: 'Espectador del sistema',
        app_module_permissions: [
          module_permission_ids['permission:posts_list'],
          module_permission_ids['permission:posts_viewer'],
          module_permission_ids['permission:banners_list'],
          module_permission_ids['permission:banners_viewer'],
          module_permission_ids['permission:forums_list'],
          module_permission_ids['permission:forums_viewer'],
          module_permission_ids['permission:users_list'],
          module_permission_ids['permission:users_viewer'],
          module_permission_ids['permission:roles_list'],
          module_permission_ids['permission:roles_viewer'],
          module_permission_ids['permission:modules_list'],
          module_permission_ids['permission:modules_viewer'],
          module_permission_ids['permission:countries_list'],
          module_permission_ids['permission:countries_viewer'],
          module_permission_ids['permission:course_scheduling_list'],
          module_permission_ids['permission:course_scheduling_viewer'],
          module_permission_ids['permission:courses_list'],
          module_permission_ids['permission:courses_viewer'],
          module_permission_ids['permission:companies_list'],
          module_permission_ids['permission:companies_viewer'],
          module_permission_ids['permission:modular_list'],
          module_permission_ids['permission:modular_viewer'],

          module_permission_ids['permission:posts_menu_access'],
          module_permission_ids['permission:banners_menu_access'],
          module_permission_ids['permission:forums_menu_access'],
          module_permission_ids['permission:users_menu_access'],
          module_permission_ids['permission:roles_menu_access'],
          module_permission_ids['permission:companies_menu_access'],
          module_permission_ids['permission:courses_menu_access'],
          module_permission_ids['permission:course_scheduling_menu_access'],
          module_permission_ids['permission:modular_menu_access'],
        ],
        homes: [
          home_ids['admin']
        ],
        moodle_id: 7
      },
    ]

    for await (const role of roles) {
      const exists: any = await roleService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: role.name}]
      })
      if (exists.status === 'success') {
        role['id'] = exists.role._id
        roles_ids[`${role['name']}`] = exists.role._id
      }

      const role_response:any = await roleService.insertOrUpdate(role)
      if (role_response.status === 'success') {
        const roleRegister = role_response.role
        roles_ids[`${role['name']}`] = roleRegister._id
      }
    }
    return roles_ids
  }

  /**
   * Metodo que permite agregar usuarios
   * @param role_ids
   * @returns
   */
  private addUsers = async (role_ids) => {

    let user_ids = {}
    const users = [
      {
        username: 'useradmin',
        password: '123456',
        email: 'useradmin@example.com',
        profile: {
          first_name: 'User',
          last_name: 'Admin'
        },
        roles: [
          role_ids['admin']
        ]
      },
      {
        username: 'userviewer',
        password: '123456',
        email: 'userviewer@example.com',
        profile: {
          first_name: 'User',
          last_name: 'Viewer'
        },
        roles: [
          role_ids['viewer']
        ]
      }
    ]
    for await (const user of users) {
      const exists: any = await userService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'username', value: user.username}]
      })
      if (exists.status === 'success') user['id'] = exists.user._id

      const user_response:any = await userService.insertOrUpdate(user)
      if (user_response.status === 'success') {
        user_ids[user.username] = user_response.user._id
      }
    }
    return user_ids
  }

  /**
   * Metodo que permite agregar tipos de publicaciones
   * @returns
   */
  private addPostTypes = async () => {

    let post_type_ids = {}
    const post_types = [
      {name: 'news'},{name: 'events'},{name: 'research'}, {name: 'blog'}, {name: 'capsules'}, {name: 'webinar'}
    ]
    for await (const postType of post_types) {
      const exists: any = await postTypeService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: postType.name}]
      })
      if (exists.status === 'success') postType['id'] = exists.postType._id

      const response:any = await postTypeService.insertOrUpdate(postType)
      if (response.status === 'success') {
        post_type_ids[postType.name] = response.postType._id
      }
    }
    return post_type_ids
  }

  /**
   * Metodo que permite agregar tipos de publicaciones
   * @returns
   */
  private addPostLocations = async () => {

    let post_location_ids = {}
    const post_locations = [
      {name: 'student'},{name: 'teacher'},{name: 'guest'},
    ]
    for await (const postLocation of post_locations) {
      const exists: any = await postLocationService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: postLocation.name}]
      })
      if (exists.status === 'success') postLocation['id'] = exists.postLocation._id

      const response:any = await postLocationService.insertOrUpdate(postLocation)
      if (response.status === 'success') {
        post_location_ids[postLocation.name] = response.postLocation._id
      }
    }
    return post_location_ids
  }

  /**
   * Metodo que permite agregar ubicaciones de foros
   * @returns
   */
  private addForumLocations = async () => {

    let forum_location_ids = {}
    const forum_locations = [
      {name: 'student'},{name: 'teacher'},{name: 'guest'},
    ]
    for await (const forumLocation of forum_locations) {
      const exists: any = await forumLocationService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: forumLocation.name}]
      })
      if (exists.status === 'success') forumLocation['id'] = exists.forumLocation._id

      const response:any = await forumLocationService.insertOrUpdate(forumLocation)
      if (response.status === 'success') {
        forum_location_ids[forumLocation.name] = response.forumLocation._id
      }
    }
    return forum_location_ids
  }

  /**
   * Metodo que permite crear categorias para los modos de cursos
   * @returns
   */
  private addCourseModesCategories = async () => {

    let course_mode_ids = {}
    const courseModes = [
      {name: 'in_situ', description: 'Presencial'},
      {name: 'online', description: 'Online'},
      {name: 'virtual', description: 'Virtual'},
      {name: 'blended_learning', description: 'Blended Learning'},
    ]
    for await (const courseMode of courseModes) {
      const exists: any = await courseModeCategoryService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: courseMode.name}]
      })
      if (exists.status === 'success') courseMode['id'] = exists.courseModeCategory._id

      const response:any = await courseModeCategoryService.insertOrUpdate(courseMode)
      if (response.status === 'success') {
        course_mode_ids[courseMode.name] = response.courseModeCategory._id
      }
    }
    return course_mode_ids
  }

  /**
   * Metodo que permite crear categorias para los modos de cursos
   * @returns
   */
  private addRegionals = async () => {

    let regional_ids = {}
    const regionals = [
      {name: 'Antioquia, Chocó y Eje Cafetero'},
      {name: 'Sur Occidente'},
      {name: 'Oriente'},
      {name: 'Centro y Sur Oriente'},
      {name: 'Caribe'},
      {name: 'Internacional'},
    ]
    for await (const regional of regionals) {
      const exists: any = await regionalService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: regional.name}]
      })
      if (exists.status === 'success') regional['id'] = exists.regional._id

      const response:any = await regionalService.insertOrUpdate(regional)
      if (response.status === 'success') {
        regional_ids[regional.name] = response.regional._id
      }
    }
    return regional_ids
  }

  /**
   * Metodo que permite crear estados de programación
   * @returns
   */
  private addCourseSchedulingStatuses = async () => {

    let status_ids = {}
    const statuses = [
      {name: 'Programado', description: 'Programado'},
      {name: 'Confirmado', description: 'Confirmado'},
      {name: 'Ejecutado', description: 'Ejecutado'},
      {name: 'Cancelado', description: 'Cancelado'},
    ]
    for await (const status of statuses) {
      const exists: any = await courseSchedulingStatusService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: status.name}]
      })
      if (exists.status === 'success') status['id'] = exists.courseSchedulingStatus._id

      const response:any = await courseSchedulingStatusService.insertOrUpdate(status)
      if (response.status === 'success') {
        status_ids[status.name] = response.courseSchedulingStatus._id
      }
    }
    return status_ids
  }

  /**
   * Metodo que permite crear tipos de programación
   * @returns
   */
   private addCourseSchedulingTypes = async () => {

    let type_ids = {}
    const types = [
      {name: 'Abierto', description: 'Abierto'},
      {name: 'Empresarial', description: 'Empresarial'},
    ]
    for await (const type of types) {
      const exists: any = await courseSchedulingTypeService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: type.name}]
      })
      if (exists.status === 'success') type['id'] = exists.courseSchedulingType._id

      const response:any = await courseSchedulingTypeService.insertOrUpdate(type)
      if (response.status === 'success') {
        type_ids[type.name] = response.courseSchedulingType._id
      }
    }
    return type_ids
  }

  /**
   * Metodo que permite crear modos de programación
   * @returns
   */
   private addCourseSchedulingModes = async () => {

    let mode_ids = {}
    const modes = [
      {name: 'Presencial', description: 'Presencial'},
      {name: 'Virtual', description: 'Virtual'},
      {name: 'En linea', description: 'En linea'},
      {name: 'Combinada', description: 'Combinada'},
    ]
    for await (const mode of modes) {
      const exists: any = await courseSchedulingModeService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: mode.name}]
      })
      if (exists.status === 'success') mode['id'] = exists.courseSchedulingMode._id

      const response:any = await courseSchedulingModeService.insertOrUpdate(mode)
      if (response.status === 'success') {
        mode_ids[mode.name] = response.courseSchedulingMode._id
      }
    }
    return mode_ids
  }

  // @end
}

export const initSeeder = new InitSeeder();
export { InitSeeder };
