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

import { questionCategoryService } from "@scnode_app/services/default/admin/academicContent/questions/questionCategoryService";
import {academicResourceCategoryService} from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceCategoryService'
import { academicResourceConfigCategoryService } from "@scnode_app/services/default/admin/academicContent/academicResource/academicResourceConfigCategoryService";

import {postTypeService} from '@scnode_app/services/default/admin/post/postTypeService'
import {postLocationService} from '@scnode_app/services/default/admin/post/postLocationService'

import {forumLocationService} from '@scnode_app/services/default/admin/forum/forumLocationService'

import {courseModeCategoryService} from '@scnode_app/services/default/admin/course/courseModeCategoryService'
import {regionalService} from '@scnode_app/services/default/admin/regional/regionalService'
import {courseSchedulingModeService} from '@scnode_app/services/default/admin/course/courseSchedulingModeService'
import {courseSchedulingStatusService} from '@scnode_app/services/default/admin/course/courseSchedulingStatusService'
import {courseSchedulingTypeService} from '@scnode_app/services/default/admin/course/courseSchedulingTypeService'

import {courseSchedulingService} from '@scnode_app/services/default/admin/course/courseSchedulingService'
import { modularService } from "@scnode_app/services/default/admin/modular/modularService";

import { attachedCategoryService } from '@scnode_app/services/default/admin/attachedCategory/attachedCategoryService';
// @end

// @import_utilitites Import utilities
// @end

// @import_types Import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
import { IModulePermission } from "@scnode_app/types/default/global/permissionTypes";
import { IAttachedCategory } from '@scnode_app/types/default/admin/attachedCategory/attachedCategoryTypes';
// @end

class InitSeeder extends DefaultPluginsSeederSeederService {

  /**
   * Metodo que contiene la logica del seeder
   * @return Booleano que identifica si se pudo o no ejecutar el Seeder
   */
  public run = async () => {
    // @seeder_logic Add seeder logic

    // @INFO: Agregando ciudades
    // let country_ids = await this.addCountries()

    // // @INFO: Agregando homes
    // let home_ids = await this.addHomes()

    // @INFO: Agregando modulos y permisos
    let {module_ids, module_permission_ids} = await this.addAppModulesAndPermissions()

    // // @INFO: Agregando roles
    // let role_ids = await this.addRoles(module_permission_ids, home_ids)

    // // @INFO: Agregando usuarios
    // let user_ids = await this.addUsers(role_ids)

    // // @INFO: Agregando tipos de publicaciones
    // let post_type_ids = await this.addPostTypes()

    // @INFO: Agregando tipos de ubicaciones
    // let post_location_ids = await this.addPostLocations()

    // // @INFO: Agregando modos de cursos
    // let course_mode_ids = await this.addCourseModesCategories()

    // // @INFO: Agregando regionales
    // let regional_ids = await this.addRegionals()

    // // @INFO: Agregando estados de programación
    // let scheduling_status_ids = await this.addCourseSchedulingStatuses()

    // // @INFO: Agregando tipos de programación
    // let scheduling_type_ids = await this.addCourseSchedulingTypes()

    // // @INFO: Agregando modos de programación
    // let scheduling_mode_ids = await this.addCourseSchedulingModes()

    // // @INFO: Agregando categorias de recursos academicos
    // let academic_resource_category_ids = await this.addAcademicResourceCategories()

    // // @INFO: Agregando categorias de recursos academicos
    // let academic_resource_config_category_ids = await this.addAcademicResourceConfigCategories()

    // // @INFO: Agregando categorias de preguntas
    // let question_category_ids = await this.addQuestionCategories()

    // // TODO: Agregar PostCategories

    // // TODO: Agregar entornos

    // // @INFO: Agregando tipos de ubicaciones
    // let forum_location_ids = await this.addForumLocations()

    // @INFO Agregando categorías de adjuntos
    // await this.addAttachedCategories();

    // // @INFO: Agregando programaciones
    // // let course_scheduling_ids = await this.addCourseScheduling()

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
      {name: 'account_executive', description: 'Home destinado para ejecutivos de cuenta'},
      {name: 'company', description: 'Home destinado para usuarios de empresas'},
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

    const modules: IModulePermission[] = [
      {
        name: 'global_permissions', description: 'Este modulo contiene los permisos globales', permissions: [
          { name: 'config:is_teacher', description: 'Permiso que identifica a los docentes dentro del campus' },
          { name: 'config:is_student', description: 'Permiso que identifica a los estudiantes dentro del campus' },
          { name: 'config:is_account_executive', description: 'Permiso que identifica a los ejecutivos de cuenta dentro del campus' },
          { name: 'config:is_company_user', description: 'Permiso que identifica a los usuarios de compañia'},
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
        {name: 'permission:forums_response', description: 'Consultar foros' },
        {name: 'permission:forums_menu_access', description: 'Menu de foros'},
      ] },
      {name: 'module:users', description: 'Módulo que permite administrar los usuarios', permissions: [
        {name: 'permission:users_create', description: 'Crear usuarios'},
        {name: 'permission:users_update', description: 'Editar usuarios'},
        {name: 'permission:students_update', description: 'Editar estudiantes'},
        {name: 'permission:users_field_first_name', description: 'Condición para campo de usuarios (Nombres)'},
        {name: 'permission:users_field_last_name', description: 'Condición para campo de usuarios (Apellidos)'},
        {name: 'permission:users_field_username', description: 'Condición para campo de usuarios (Usuario)'},
        {name: 'permission:users_field_email', description: 'Condición para campo de usuarios (Email)'},
        {name: 'permission:users_field_phone_number', description: 'Condición para campo de usuarios (Numero celular)'},
        {name: 'permission:users_field_doc_number', description: 'Condición para campo de usuarios (Numero de documento)'},
        {name: 'permission:users_field_doc_type', description: 'Condición para campo de usuarios (Tipo de documento)'},
        {name: 'permission:users_field_programming_code', description: 'Condición para campo de usuarios (Codigo de programación)'},
        {name: 'permission:users_field_password', description: 'Condición para campo de usuarios (Contraseña)'},
        {name: 'permission:users_field_timezone', description: 'Condición para campo de usuarios (Zona horaria)'},
        {name: 'permission:users_field_dialect', description: 'Condición para campo de usuarios (Idiom)'},
        {name: 'permission:users_field_roles', description: 'Condición para campo de usuarios (Roles)'},
        {name: 'permission:users_delete', description: 'Eliminar usuarios'},
        {name: 'permission:users_list', description: 'Ver usuarios'},
        {name: 'permission:users_viewer', description: 'Consultar usuarios'},
        {name: 'permission:users_menu_access', description: 'Menu de usuarios'},
      ]},
      {name: 'module:account_executives', description: 'Módulo que permite administrar los ejecutivos de cuenta', permissions: [
        {name: 'permission:account_executives_menu_access', description: 'Menu de ejecutivos de cuenta'},
      ]},
      {name: 'module:students', description: 'Módulo que permite administrar los estudiantes', permissions: [
        {name: 'permission:students_menu_access', description: 'Menu de estudiantes'},
      ]},
      {name: 'module:company_collaborator', description: 'Módulo que permite administrar los colaboradores de Empresa', permissions: [
        {name: 'permission:company_collaborator_access', description: 'Menu de colaboradores de Empresa'},
      ]},
      {name: 'module:portfolio', description: 'Módulo que permite administrar el portafolio', permissions: [
        {name: 'permission:portfolio_menu_access', description: 'Menu de portafolio'},
      ]},
      {name: 'module:student_administrator', description: 'Módulo que permite administrar los estudiantes', permissions: [
        {name: 'permission:student_administrator_menu_access', description: 'Menu de administración de estudiantes'},
      ]},
      {name: 'module:reports', description: 'Módulo que permite administrar los reportes', permissions: [
        {name: 'permission:reports_menu_access', description: 'Menu de pantalla de reportes'},
      ]},
      {name: 'module:qualifiedTeacher', description: 'Módulo que permite administrar los docentes y tutores', permissions: [
        {name: 'permission:qualifiedTeacher_create', description: 'Crear docentes'},
        {name: 'permission:qualifiedTeacher_update', description: 'Editar docentes'},
        {name: 'permission:qualifiedTeacher_delete', description: 'Eliminar docentes'},
        {name: 'permission:qualifiedTeacher_list', description: 'Ver docentes'},
        {name: 'permission:qualifiedTeacher_viewer', description: 'Consultar docentes'},
        {name: 'permission:qualifiedTeacher_menu_access', description: 'Menu de docentes'},
        {name: 'permission:qualifiedTeacher_upload_bulk', description: 'Carga masiva de docentes calificados'},
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
        {name: 'permission:course_scheduling_reprogramming', description: 'Solicitar reprogramación'},

        {name: 'permission:course_scheduling_associations_view', description: 'Ver asociaciones de programaciones'},
        {name: 'permission:course_scheduling_associations_add', description: 'Crear/Actualizar asociaciones de programaciones'},

        {name: 'permission:course_scheduling_reactivate', description: 'Reactiva programaciones'},

        {name: 'permission:course_scheduling_upload_business_report', description: 'Carga de informe empresarial'},
        {name: 'permission:course_scheduling_upload_partial_report', description: 'Carga de informe empresarial parcial'},

        {name: 'permission:course_scheduling_force_change_confirmed_to_programmed', description: 'Forzar cambio desde confirmado a programado'},
      ]},
      {name: 'module:course_scheduling_enrollment', description: 'Módulo que permite administrar los programas', permissions: [
        {name: 'permission:course_scheduling_enrollment_create', description: 'Crear programas'},
        // {name: 'permission:course_scheduling_enrollment_update', description: 'Editar programas'},
        {name: 'permission:course_scheduling_enrollment_delete', description: 'Eliminar programas'},
        {name: 'permission:course_scheduling_enrollment_list', description: 'Ver programas'},
        {name: 'permission:course_scheduling_enrollment_viewer', description: 'Consultar programas'},
        {name: 'permission:course_scheduling_enrollment_generate_certifications', description: 'Generar certificados'},
        {name: 'permission:course_scheduling_enrollment_download_certifications', description: 'Descargar certificados'},
        {name: 'permission:course_scheduling_enrollment_reissue_certifications', description: 'Reexpedir certificados'},
        {name: 'permission:course_scheduling_enrollment_force_preview_certifications', description: 'Forzar previsualización de certificados'}
        // {name: 'permission:course_scheduling_enrollment_menu_access', description: 'Menu de programas'},
      ]},
      {name: 'module:modular', description: 'Módulo que permite administrar los modulares', permissions: [
        {name: 'permission:modular_create', description: 'Crear modulares'},
        {name: 'permission:modular_update', description: 'Editar modulares'},
        {name: 'permission:modular_delete', description: 'Eliminar modulares'},
        {name: 'permission:modular_list', description: 'Ver modulares'},
        {name: 'permission:modular_viewer', description: 'Consultar modulares'},
        {name: 'permission:modular_menu_access', description: 'Menu de modulares'},
      ]},
      {name: 'module:survey', description: 'Modulo que permite la creación de encuestas', permissions: [
        {name: 'permission:survey_create', description: 'Crear contenido'},
        {name: 'permission:survey_update', description: 'Actualizar contenido'},
        {name: 'permission:survey_delete', description: 'Eliminar contenido'},
        {name: 'permission:survey_menu_access', description: 'Menu de encuesta'},
        {name: 'permission:survey_report', description: 'Generar reporte de satisfacción'}
      ]},
      {name: 'module:landings', description: 'Modulo que permite la administración de secciones publicas', permissions: [
        {name: 'permission:landings_teacher', description: 'Landing de docentes'},
        {name: 'permission:landings_teacher_general_info', description: 'Landing de docentes'},
        {name: 'permission:landings_teacher_article', description: 'Landing de docentes'},
        {name: 'permission:landings_teacher_training', description: 'Landing de docentes'},
        {name: 'permission:landings_teacher_scheduling', description: 'Landing de docentes'},
        {name: 'permission:landings_teacher_forums', description: 'Landing de docentes'},

        {name: 'permission:landings_business', description: 'Landing de empresas'},
        {name: 'permission:landings_business_general_info', description: 'Landing de empresas'},
        {name: 'permission:landings_business_article', description: 'Landing de empresas'},
        {name: 'permission:landings_business_training', description: 'Landing de empresas'},
        {name: 'permission:landings_business_scheduling', description: 'Landing de empresas'},
        {name: 'permission:landings_business_forums', description: 'Landing de empresas'},

        {name: 'permission:landings_officials', description: 'Landing de colaboradores'},
        {name: 'permission:landings_officials_general_info', description: 'Landing de colaboradores'},
        {name: 'permission:landings_officials_article', description: 'Landing de colaboradores'},
        {name: 'permission:landings_officials_training', description: 'Landing de colaboradores'},
        {name: 'permission:landings_officials_scheduling', description: 'Landing de colaboradores'},
        {name: 'permission:landings_officials_forums', description: 'Landing de colaboradores'},

        {name: 'permission:landings_student', description: 'Landing de estudiantes'},
        {name: 'permission:landings_student_general_info', description: 'Landing de estudiantes'},
        {name: 'permission:landings_student_article', description: 'Landing de estudiantes'},
        {name: 'permission:landings_student_training', description: 'Landing de estudiantes'},
        {name: 'permission:landings_student_scheduling', description: 'Landing de estudiantes'},
        {name: 'permission:landings_student_forums', description: 'Landing de estudiantes'},


        {name: 'permission:landings_alliances', description: 'Landing de alianzas'},
        {name: 'permission:landings_alliances_article', description: 'Articulos en landing de alianzas'},
        {name: 'permission:landings_alliances_items', description: 'Lista de alianzas'},
        {name: 'permission:landings_alliances_items_create', description: 'Crear nueva alianza'},
        {name: 'permission:landings_alliances_items_update', description: 'Actualizar alianza'},
        {name: 'permission:landings_alliances_items_delete', description: 'Eliminar alianza'},

        // {name: 'permission:survey_update', description: 'Actualizar contenido'},
        // {name: 'permission:survey_delete', description: 'Eliminar contenido'},
        {name: 'permission:landings_menu_access', description: 'Menu de configuración de landings'}
      ]},
      {name: 'module:profile', description: 'Modulo que permite la administración del perfil de usuario', permissions: [
        {name: 'permission:profile_menu_access', description: 'Menu de perfil de usuario'}
      ]},
      {name: 'module:teaching_resources', description: 'Modulo que permite la administración de recursos para la enseñanza', permissions: [
        {name: 'permission:teaching_resources_menu_access', description: 'Menu de recursos para la enseñanza'}
      ]},
      {name: 'module:consultation_room', description: 'Modulo que permite la administración de sala de consulta', permissions: [
        {name: 'permission:consultation_room_menu_access', description: 'Menu de sala de consulta'}
      ]},
      {name: 'module:isolution', description: 'Modulo que permite la administración de isolucion', permissions: [
        {name: 'permission:isolution_menu_access', description: 'Menu de isolucion'}
      ]},
      {name: 'module:jira', description: 'Modulo que permite la administración de JIRA', permissions: [
        {name: 'permission:jira_menu_access', description: 'Menu de JIRA'}
      ]},
      {name: 'module:publications', description: 'Modulo que permite la administración de publicaciones', permissions: [
        {name: 'permission:publications_menu_access', description: 'Menu de publicaciones'}
      ]},
      {name: 'module:document_processor', description: 'Modulo que permite la administración de la cola de documentos', permissions: [
        {name: 'permission:document_processor_delete', description: 'Eliminar documento en cola'},
        {name: 'permission:document_processor_list', description: 'Ver cola de documentos'},
      ]}
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
          module_permission_ids['permission:forums_response'],
          module_permission_ids['permission:users_create'],
          module_permission_ids['permission:users_update'],
          module_permission_ids['permission:users_delete'],
          module_permission_ids['permission:users_list'],
          module_permission_ids['permission:qualifiedTeacher_create'],
          module_permission_ids['permission:qualifiedTeacher_update'],
          module_permission_ids['permission:qualifiedTeacher_delete'],
          module_permission_ids['permission:qualifiedTeacher_list'],
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
          module_permission_ids['permission:course_scheduling_enrollment_list'],
          module_permission_ids['permission:course_scheduling_enrollment_generate_certifications'],
          module_permission_ids['permission:course_scheduling_enrollment_download_certifications'],
          module_permission_ids['permission:course_scheduling_enrollment_create'],
          module_permission_ids['permission:course_scheduling_enrollment_update'],
          module_permission_ids['permission:course_scheduling_enrollment_delete'],
          module_permission_ids['permission:companies_create'],
          module_permission_ids['permission:companies_update'],
          module_permission_ids['permission:companies_delete'],
          module_permission_ids['permission:companies_list'],
          module_permission_ids['permission:modular_create'],
          module_permission_ids['permission:modular_update'],
          module_permission_ids['permission:modular_delete'],
          module_permission_ids['permission:modular_list'],

          module_permission_ids['permission:courses_create'],
          module_permission_ids['permission:courses_update'],
          module_permission_ids['permission:courses_delete'],
          module_permission_ids['permission:courses_list'],

          module_permission_ids['permission:posts_menu_access'],
          module_permission_ids['permission:banners_menu_access'],
          module_permission_ids['permission:forums_menu_access'],
          module_permission_ids['permission:users_menu_access'],
          module_permission_ids['permission:account_executives_menu_access'],
          module_permission_ids['permission:company_collaborator_access'],
          module_permission_ids['permission:portfolio_menu_access'],
          module_permission_ids['permission:student_administrator_menu_access'],
          module_permission_ids['permission:roles_menu_access'],
          module_permission_ids['permission:companies_menu_access'],
          module_permission_ids['permission:courses_menu_access'],
          module_permission_ids['permission:course_scheduling_menu_access'],
          module_permission_ids['permission:modular_menu_access'],
          module_permission_ids['permission:qualifiedTeacher_menu_access'],

          // @INFO Permisos para el modulo editor (Catalogador)
          module_permission_ids['permission:survey_menu_access'],
          module_permission_ids['permission:survey_create'],
          module_permission_ids['permission:survey_update'],
          module_permission_ids['permission:survey_delete'],
          module_permission_ids['permission:survey_report'],

          // @INFO Permisos para el modulo landings
          module_permission_ids['permission:landings_menu_access'],
          module_permission_ids['permission:landings_teacher'],
          module_permission_ids['permission:landings_teacher_general_info'],
          module_permission_ids['permission:landings_teacher_article'],
          module_permission_ids['permission:landings_teacher_training'],
          module_permission_ids['permission:landings_teacher_scheduling'],
          module_permission_ids['permission:landings_teacher_forums'],
          module_permission_ids['permission:landings_business'],
          module_permission_ids['permission:landings_business_general_info'],
          module_permission_ids['permission:landings_business_article'],
          module_permission_ids['permission:landings_business_training'],
          module_permission_ids['permission:landings_business_scheduling'],
          module_permission_ids['permission:landings_officials'],
          module_permission_ids['permission:landings_officials_general_info'],
          module_permission_ids['permission:landings_officials_article'],
          module_permission_ids['permission:landings_officials_training'],
          module_permission_ids['permission:landings_officials_scheduling'],
          module_permission_ids['permission:landings_student'],
          module_permission_ids['permission:landings_student_general_info'],
          module_permission_ids['permission:landings_student_article'],
          module_permission_ids['permission:landings_student_training'],
          module_permission_ids['permission:landings_student_scheduling'],
        ],
        homes: [
          home_ids['admin']
        ],
        moodle_id: 1
      },
      // {
      //   name: 'student',
      //   description: 'Estudiante',
      //   app_module_permissions: [
      //     module_permission_ids['config:is_student'],
      //     module_permission_ids['config:go_to_campus'],
      //     module_permission_ids['config:go_to_moodle'],
      //     module_permission_ids['permission:profile_menu_access'],
      //     module_permission_ids['permission:publications_menu_access'],
      //     module_permission_ids['permission:consultation_room_menu_access'],
      //   ],
      //   homes: [
      //     home_ids['student']
      //   ],
      //   moodle_id: 5
      // },
      {
        name: 'teacher',
        description: 'Docente',
        app_module_permissions: [
          module_permission_ids['config:is_teacher'],
          module_permission_ids['config:go_to_campus'],
          module_permission_ids['config:go_to_moodle'],
          module_permission_ids['permission:profile_menu_access'],
          module_permission_ids['permission:publications_menu_access'],
          module_permission_ids['permission:teaching_resources_menu_access'],
          module_permission_ids['permission:consultation_room_menu_access'],
          module_permission_ids['permission:forums_create'],
          module_permission_ids['permission:forums_update'],
          module_permission_ids['permission:forums_delete'],
          module_permission_ids['permission:forums_list'],
          module_permission_ids['permission:forums_response'],
        ],
        homes: [
          home_ids['teacher']
        ],
        moodle_id: 4
      },
      // {
      //   name: 'scheduling_coordinator',
      //   description: 'Coordinador de programación',
      //   app_module_permissions: [
      //     module_permission_ids['permission:course_scheduling_list'],
      //     module_permission_ids['permission:course_scheduling_create'],
      //     module_permission_ids['permission:course_scheduling_update'],
      //     module_permission_ids['permission:course_scheduling_delete'],
      //     module_permission_ids['permission:course_scheduling_enrollment_list'],
      //     module_permission_ids['permission:course_scheduling_enrollment_create'],
      //     module_permission_ids['permission:course_scheduling_enrollment_update'],
      //     module_permission_ids['permission:course_scheduling_enrollment_delete'],

      //     module_permission_ids['permission:courses_create'],
      //     module_permission_ids['permission:courses_update'],
      //     module_permission_ids['permission:courses_delete'],
      //     module_permission_ids['permission:courses_list'],

      //     module_permission_ids['permission:courses_menu_access'],
      //     module_permission_ids['permission:course_scheduling_menu_access'],
      //   ],
      //   homes: [
      //     home_ids['admin']
      //   ],
      //   moodle_id: 1
      // },
      // {
      //   name: 'logistics_assistant',
      //   description: 'Auxiliar logistico',
      //   app_module_permissions: [
      //     module_permission_ids['permission:course_scheduling_list'],
      //     module_permission_ids['permission:course_scheduling_create'],
      //     module_permission_ids['permission:course_scheduling_update'],
      //     module_permission_ids['permission:course_scheduling_delete'],
      //     module_permission_ids['permission:course_scheduling_enrollment_list'],
      //     module_permission_ids['permission:course_scheduling_enrollment_create'],
      //     module_permission_ids['permission:course_scheduling_enrollment_update'],
      //     module_permission_ids['permission:course_scheduling_enrollment_delete'],

      //     module_permission_ids['permission:courses_create'],
      //     module_permission_ids['permission:courses_update'],
      //     module_permission_ids['permission:courses_delete'],
      //     module_permission_ids['permission:courses_list'],

      //     module_permission_ids['permission:courses_menu_access'],
      //     module_permission_ids['permission:course_scheduling_menu_access'],
      //   ],
      //   homes: [
      //     home_ids['admin']
      //   ],
      //   moodle_id: 1
      // },
      // {
      //   name: 'Tutor',
      //   description: 'Encargado de crear y modificar la programación de servicios educativos.',
      //   app_module_permissions: [
      //     module_permission_ids['config:is_teacher'],
      //   ],
      //   homes: [
      //     home_ids['teacher']
      //   ],
      //   moodle_id: 4
      // },
      // {
      //   name: 'viewer',
      //   description: 'Espectador del sistema',
      //   app_module_permissions: [
      //     module_permission_ids['permission:posts_list'],
      //     module_permission_ids['permission:posts_viewer'],
      //     module_permission_ids['permission:banners_list'],
      //     module_permission_ids['permission:banners_viewer'],
      //     module_permission_ids['permission:forums_list'],
      //     module_permission_ids['permission:forums_viewer'],
      //     module_permission_ids['permission:users_list'],
      //     module_permission_ids['permission:users_viewer'],
      //     module_permission_ids['permission:roles_list'],
      //     module_permission_ids['permission:roles_viewer'],
      //     module_permission_ids['permission:modules_list'],
      //     module_permission_ids['permission:modules_viewer'],
      //     module_permission_ids['permission:countries_list'],
      //     module_permission_ids['permission:countries_viewer'],
      //     module_permission_ids['permission:course_scheduling_list'],
      //     module_permission_ids['permission:course_scheduling_viewer'],
      //     module_permission_ids['permission:course_scheduling_enrollment_list'],
      //     module_permission_ids['permission:course_scheduling_enrollment_viewer'],
      //     module_permission_ids['permission:courses_list'],
      //     module_permission_ids['permission:courses_viewer'],
      //     module_permission_ids['permission:companies_list'],
      //     module_permission_ids['permission:companies_viewer'],
      //     module_permission_ids['permission:modular_list'],
      //     module_permission_ids['permission:modular_viewer'],

      //     module_permission_ids['permission:posts_menu_access'],
      //     module_permission_ids['permission:banners_menu_access'],
      //     // module_permission_ids['permission:forums_menu_access'],
      //     module_permission_ids['permission:users_menu_access'],
      //     module_permission_ids['permission:roles_menu_access'],
      //     module_permission_ids['permission:companies_menu_access'],
      //     module_permission_ids['permission:courses_menu_access'],
      //     module_permission_ids['permission:course_scheduling_menu_access'],
      //     module_permission_ids['permission:modular_menu_access'],
      //   ],
      //   homes: [
      //     home_ids['admin']
      //   ],
      //   moodle_id: 7
      // },
      // {
      //   name: 'account_executive',
      //   description: 'Ejecutivo de cuenta',
      //   app_module_permissions: [
      //     module_permission_ids['config:is_account_executive'],
      //     module_permission_ids['permission:profile_menu_access'],
      //     module_permission_ids['permission:publications_menu_access'],
      //     module_permission_ids['permission:consultation_room_menu_access'],
      //     module_permission_ids['permission:isolution_menu_access'],
      //     // module_permission_ids['config:go_to_campus'],
      //     // module_permission_ids['config:go_to_moodle'],
      //   ],
      //   homes: [
      //     home_ids['account_executive']
      //   ],
      //   // moodle_id: 4
      // },
      {
        name: 'company',
        description: 'Compañia',
        app_module_permissions: [
          module_permission_ids['config:is_company_user'],
          module_permission_ids['permission:profile_menu_access'],
        ],
        homes: [
          home_ids['company']
        ],
        // moodle_id: 4
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
      },
      {
        username: 'userschedulingcoordinator',
        password: '123456',
        email: 'userschedulingcoordinator@example.com',
        profile: {
          first_name: 'User',
          last_name: 'Scheduling Coordinator'
        },
        roles: [
          role_ids['scheduling_coordinator']
        ]
      },
      {
        username: 'userlogisticsassistant',
        password: '123456',
        email: 'userlogisticsassistant@example.com',
        profile: {
          first_name: 'User',
          last_name: 'Logistics Assistant'
        },
        roles: [
          role_ids['logistics_assistant']
        ]
      },
      {
        username: 'userexecutive',
        password: '123456',
        email: 'userexecutive@example.com',
        profile: {
          first_name: 'User',
          last_name: 'Executive'
        },
        roles: [
          role_ids['account_executive']
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
      {name: 'news', description: 'Noticias'},
      {name: 'events', description: 'Eventos'},
      {name: 'research', description: 'Artículos'},
      {name: 'blog', description: 'Blogs'},
      {name: 'capsules', description: 'Capsulas'},
      {name: 'webinar', description: 'Webinars'},
      {name: 'podcast', description: 'Podcast'}
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
      {name: 'student', description: 'Dashboard de estudiantes'},
      {name: 'teacher', description: 'Dashboard de docentes'},
      {name: 'guest', description: 'Landing principal'},
      {name: 'officials_landing', description: 'Landing de colaboradores'},
      {name: 'company', description: 'Dashboard de empresas'},
      {name: 'live', description: 'En vivo'},
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
      {name: 'Transversal', moodle_id: 6, short_key: 'TR'},
      {name: 'Antioquia, Chocó y Eje Cafetero', moodle_id: 19, short_key: 'AN'},
      {name: 'Sur Occidente', moodle_id: 20, short_key: 'SO'},
      {name: 'Oriente', moodle_id: 21, short_key: 'OR'},
      {name: 'Centro y Sur Oriente', moodle_id: 22, short_key: 'CS'},
      {name: 'Caribe', moodle_id: 13, short_key: 'CA'},
      {name: 'Internacional', moodle_id: 23, short_key: 'IN'},
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

  /**
   * Metodo que permite crear categorias de recursos academicos
   * @returns
   */
  private addAcademicResourceCategories = async () => {
    let academic_resource_category_ids = {}

    const academic_resource_categories = [
      { name: 'survey', description: 'Encuesta', config: {
        has_order_of_questions: true,
        has_course_modes: true
      }},
    ]

    for await (const category of academic_resource_categories) {
      const exists: any = await academicResourceCategoryService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: category.name}]
      })
      if (exists.status === 'success') category['id'] = exists.category._id

      const register: any = await academicResourceCategoryService.insertOrUpdate(category)
      if (register.status === 'success') {
          academic_resource_category_ids[category.name] = register.category._id
      }
    }
    return academic_resource_category_ids
  }

  /**
   * Metodo que permite agregar categorias de configuraciones de lanzamiento
   * @returns
   */
  private addAcademicResourceConfigCategories = async () => {

    let academic_resource_config_category_ids = {}

    const academic_resource_config_categories = [
      {
        name: 'survey', description: 'Encuestas', config: {
          has_order_of_questions: true,
          has_course_modes: true
        }
      },
    ]

    for await (const category of academic_resource_config_categories) {
      const exists: any = await academicResourceConfigCategoryService.findBy({
        query: QueryValues.ONE,
        where: [{ field: 'name', value: category.name }]
      })
      if (exists.status === 'success') category['id'] = exists.category._id

      const register: any = await academicResourceConfigCategoryService.insertOrUpdate(category)
      if (register.status === 'success') {
        academic_resource_config_category_ids[category.name] = register.category._id
      }
    }

    return academic_resource_config_category_ids
  }

  /**
   * Metodo que permite crear categorias de preguntas
   * @returns
   */
  private addQuestionCategories = async () => {
    let question_category_ids = {}
    const question_categories = [
      {
        name: 'select-range', description: 'Pregunta de selección con rango', config: {
          has_order_of_answers: true,
        }
      },
      { name: 'container', description: 'Pregunta de tipo estimulo', config: {} },
      {
        name: 'multiple-choice-unique-answer', description: 'Pregunta de opción multiple con selección unica', config: {
          has_order_of_answers: true,
          has_min_checked: true,
          has_max_checked: true
        }
      },
      {
        name: 'open-answer', description: 'Pregunta de tipo abierta', config: {
          has_min_length: true,
          has_max_length: true,
          has_type_input: true,
        }
      },
    ]
    for await (const category of question_categories) {
      const exists: any = await questionCategoryService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: category.name}]
      })
      if (exists.status === 'success') category['id'] = exists.category._id

      const response:any = await questionCategoryService.insertOrUpdate(category)
      if (response.status === 'success') {
        question_category_ids[category.name] = response.category._id
      }
    }
    return question_category_ids
  }

  private addAttachedCategories = async () => {
    const attachedCategories: IAttachedCategory[] =[
      {
        name: "partial_report",
        description: "Informe parcial",
        config: {
          limit_files: 1,
          formats: ['xlsx', 'pdf', 'ppt'],
          limit_size_KB: 5000
        }
      },
      {
        name: "final_report",
        description: "Informe final",
        config: {
          limit_files: 1,
          formats: ['xlsx', 'pdf', 'ppt'],
          limit_size_KB: 5000
        }
      },
      {
        name: "business_report",
        description: "Informe empresarial",
        config: {
          limit_files: 1,
          formats: ['xlsx', 'pdf', 'ppt'],
          limit_size_KB: 5000
        }
      },
      {
        name: "course_scheduling_attachments",
        description: "Adjuntos para la ventana de programacion",
        config: {
          limit_files: 3,
          formats: ['xlsx', 'pdf', 'ppt', 'docx'],
          limit_size_KB: 1000
        }
      }
    ];

    for await (let category of attachedCategories){
      const categoryResponse = await attachedCategoryService.insertOrUpdate(category);
    }
  }

  private addCourseScheduling = async () => {
    let users = {}
    const usersResponse: any = await userService.list()
    if (usersResponse.status === 'success') {
      for await (const iterator of usersResponse.users) {
        users[iterator.email] = iterator._id
      }
    }

    let modulars = {}
    const modularResponse: any = await modularService.list()
    if (modularResponse.status === 'success') {
      for await (const iterator of modularResponse.modulars) {
        modulars[iterator.name] = iterator._id
      }
    }

    let scheduling_types = {}
    const schedulingTypesResponse: any = await courseSchedulingTypeService.list()
    if (schedulingTypesResponse.status === 'success') {
      for await (const iterator of schedulingTypesResponse.courseSchedulingTypes) {
        scheduling_types[iterator.name] = iterator._id
      }
    }

    let scheduling_statuses = {}
    const schedulingStatusResponse: any = await courseSchedulingStatusService.list()
    if (schedulingStatusResponse.status === 'success') {
      for await (const iterator of schedulingStatusResponse.courseSchedulingStatuses) {
        scheduling_statuses[iterator.name] = iterator._id
      }
    }

    let countries = {}
    const countryResponse: any = await countryService.list()
    if (countryResponse.status === 'success') {
      for await (const iterator of countryResponse.countries) {
        countries[iterator.name] = iterator._id
      }
    }
    // console.log('users', users)
    // console.log('modulars', modulars)
    // console.log('scheduling_types', scheduling_types)
    // console.log('scheduling_statuses', scheduling_statuses)
    // console.log('countries', countries)


    let course_scheduling_ids = {}


    const courseSchedulings = [
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Sistemas de Gestión Integrados'],
        program: {value: 294, label: 'DA-HQ136VI01V1 | DIPLOMADO EN SISTEMAS DE GESTIÓN INTEGRADOS (NTC ISO 9001:2015, NTC ISO 14001:2015, NTC ISO 45001:2018)'},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-05',
        endDate: '2022-01-17',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 489600,
        in_design: false,
        moodle_id: '328',
        sendEmail: false,
        hasCost: true,
        priceCOP: 2745000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-08',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-08',
        enrollmentDeadline: '2021-10-08',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Mypes'],
        program: {"value": 276, "label": "PA-CA64VI02V1 | PROGRAMA DE FORMACIÓN DE AUDITORES INTERNOS PARA LA NTC ISO 9001:2015"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-05',
        endDate: '2021-12-06',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 230400,
        in_design: false,
        moodle_id: '329',
        sendEmail: false,
        hasCost: true,
        priceCOP: 756000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-08',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-08',
        enrollmentDeadline: '2021-10-08',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Sistemas de Gestión Integrados'],
        program: {"value": 293, "label": "PA-HQ64VI01V1 | PROGRAMA DE FORMACIÓN DE AUDITORES INTERNOS EN SISTEMAS DE GESTIÓN INTEGRADOS BAJO LA NTC ISO 9001:2015, NTC ISO 14001:2015, NTC ISO 45001:2018"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-05',
        endDate: '2021-12-06',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 230400,
        in_design: false,
        moodle_id: '330',
        sendEmail: false,
        hasCost: true,
        priceCOP: 1013000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-08',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-08',
        enrollmentDeadline: '2021-10-08',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Sistema de Gestión Ambiental'],
        program: {"value": 277, "label": "CU-DS16VI01V1 | CURSO COMPETENCIAS BÁSICAS PARA LA GESTIÓN AMBIENTAL NTC ISO 14001:2015 "},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-05',
        endDate: '2021-10-25',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 57600,
        in_design: false,
        moodle_id: '331',
        sendEmail: false,
        hasCost: true,
        priceCOP: 380000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-08',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-08',
        enrollmentDeadline: '2021-10-08',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Otras Herramientas y Sistemas de Gestión'],
        program: {"value": 281, "label": "CU-HE20VI01V1 | CURSO INDICADORES DE GESTIÓN"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-05',
        endDate: '2021-10-25',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 72000,
        in_design: false,
        moodle_id: '332',
        sendEmail: false,
        hasCost: true,
        priceCOP: 404000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-08',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-08',
        enrollmentDeadline: '2021-10-08',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Sistemas de Gestión Integrados'],
        program: {"value": 296, "label": "CU-HE32VI01V1 | CURSO GESTIÓN DEL RIESGO EN SISTEMAS INTEGRADOS DE GESTIÓN CON ENFOQUE EN LA NTC ISO 31000:2019"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-05',
        endDate: '2021-11-08',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 115200,
        in_design: false,
        moodle_id: '333',
        sendEmail: false,
        hasCost: true,
        priceCOP: 450000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-08',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-08',
        enrollmentDeadline: '2021-10-08',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Otras Herramientas y Sistemas de Gestión'],
        program: {"value": 295, "label": "CU-HE24VI04V1 | CURSO VIRTUAL - ONLINEHERRAMIENTAS PARA EL ANÁLISIS DEL CONTEXTO ORGANIZACIONAL"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-12',
        endDate: '2021-11-01',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 86400,
        in_design: false,
        moodle_id: '334',
        sendEmail: false,
        hasCost: true,
        priceCOP: 437500,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-15',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-15',
        enrollmentDeadline: '2021-10-15',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Sector Agroalimentario'],
        program: {"value": 284, "label": "PA-AG40VI01V1 | PROGRAMA DE FORMACION VIRTUAL DE AUDITORES INTERNOS FSSC 22000 V5.1   PARA LA INDUSTRIA DE ALIMENTOS"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-12',
        endDate: '2021-11-22',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 144000,
        in_design: false,
        moodle_id: '335',
        sendEmail: false,
        hasCost: true,
        priceCOP: 637000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-15',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-15',
        enrollmentDeadline: '2021-10-15',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Sistema de Gestión de Salud y Seguridad Trabajo'],
        program: {"value": 290, "label": "PA-SS64VI01V1 | PROGRAMA DE FORMACIÓN DE AUDITORES INTERNOS EN SEGURIDAD Y SALUD EN EL TRABAJO - ISO 45001:2018 Y DECRETO 1072 DE 2015"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-12',
        endDate: '2021-12-13',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 230400,
        in_design: false,
        moodle_id: '336',
        sendEmail: false,
        hasCost: true,
        priceCOP: 937500,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-15',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-15',
        enrollmentDeadline: '2021-10-15',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Sistemas de Gestión Integrados'],
        program: {"value": 291, "label": "CU-HQ16VI01V1 | CURSO MODELOS PARA LA INTEGRACIÓN DE SISTEMAS DE GESTIÓN(NTC ISO 9001:2015, NTC ISO 14001:2015, NTC ISO 45001:2018)"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-12',
        endDate: '2021-11-01',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 57600,
        in_design: false,
        moodle_id: '337',
        sendEmail: false,
        hasCost: true,
        priceCOP: 274000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-15',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-15',
        enrollmentDeadline: '2021-10-15',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Sistema de Gestión de Salud y Seguridad Trabajo'],
        program: {"value": 288, "label": "CU-SS16VI01V1 | CURSO FUNDAMENTOS NTC ISO 45001:2018"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-12',
        endDate: '2021-11-01',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 57600,
        in_design: false,
        moodle_id: '338',
        sendEmail: false,
        hasCost: true,
        priceCOP: 380000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-15',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-15',
        enrollmentDeadline: '2021-10-15',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Sector Salud'],
        program: {"value": 286, "label": "CU-SA16VI02V1 | CURSO LA SEGURIDAD DEL PACIENTE COMO ELEMENTO DE CALIDAD EN LAS ENTIDADES DE SALUD"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-12',
        endDate: '2021-11-01',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 57600,
        in_design: false,
        moodle_id: '339',
        sendEmail: false,
        hasCost: true,
        priceCOP: 356000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-15',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-15',
        enrollmentDeadline: '2021-10-15',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Mypes'],
        program: {"value": 276, "label": "PA-CA64VI02V1 | PROGRAMA DE FORMACIÓN DE AUDITORES INTERNOS PARA LA NTC ISO 9001:2015"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-26',
        endDate: '2021-12-27',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 230400,
        in_design: false,
        moodle_id: '340',
        sendEmail: false,
        hasCost: true,
        priceCOP: 756000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-29',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-29',
        enrollmentDeadline: '2021-10-29',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Sistemas de Gestión Integrados'],
        program: {"value": 293, "label": "PA-HQ64VI01V1 | PROGRAMA DE FORMACIÓN DE AUDITORES INTERNOS EN SISTEMAS DE GESTIÓN INTEGRADOS BAJO LA NTC ISO 9001:2015, NTC ISO 14001:2015, NTC ISO 45001:2018"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-26',
        endDate: '2021-12-27',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 230400,
        in_design: false,
        moodle_id: '341',
        sendEmail: false,
        hasCost: true,
        priceCOP: 1013000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-29',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-29',
        enrollmentDeadline: '2021-10-29',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Otras Herramientas y Sistemas de Gestión'],
        program: {"value": 278, "label": "PA-ME40VI01V1 | PROGRAMA DE  FORMACION DE AUDITORES INTERNOS EN LA ISO IEC 17025:2017"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-26',
        endDate: '2021-12-06',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 144000,
        in_design: false,
        moodle_id: '342',
        sendEmail: false,
        hasCost: true,
        priceCOP: 625000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-29',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-29',
        enrollmentDeadline: '2021-10-29',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Sistema de Gestión de Salud y Seguridad Trabajo'],
        program: {"value": 289, "label": "PA-SS40VI01V1 | PROGRAMA DE FORMACIÓN DE AUDITORES PARA LA NTC ISO 45001:2018"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-26',
        endDate: '2021-12-06',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 144000,
        in_design: false,
        moodle_id: '343',
        sendEmail: false,
        hasCost: true,
        priceCOP: 533000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-29',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-29',
        enrollmentDeadline: '2021-10-29',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Sector Salud'],
        program: {"value": 287, "label": "PA-SA40VI01V1 | PROGRAMA DE  FORMACION DE AUDITORES INTERNOS EN EL SGC  NTC ISO 9001:2015 PARA EL SECTOR SALUD"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-26',
        endDate: '2021-12-06',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 144000,
        in_design: false,
        moodle_id: '344',
        sendEmail: false,
        hasCost: true,
        priceCOP: 625000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-29',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-29',
        enrollmentDeadline: '2021-10-29',
      },
      {
        user: users['jlruiz@icontec.org'],
        schedulingMode: {value: 5, label: 'Virtual'},
        modular: modulars['Mypes'],
        program: {"value": 280, "label": "DA-CA130VI02V1 | DIPLOMADO EN GESTIÓN DE CALIDAD BAJO LA NTC ISO 9001:2015"},
        schedulingType: scheduling_types['Abierto'],
        schedulingStatus: scheduling_statuses['Programado'],
        startDate: '2021-10-26',
        endDate: '2022-02-07',
        regional_transversal: '6',
        country: countries['Colombia'],
        amountParticipants: '10',
        observations: 'N/A',
        client: 'ICONTEC',
        duration: 468000,
        in_design: false,
        moodle_id: '345',
        sendEmail: false,
        hasCost: true,
        priceCOP: 2101000,
        priceUSD: 0,
        discount: 30,
        endDiscountDate: '2021-10-29',
        startPublicationDate: '2021-09-30',
        endPublicationDate: '2021-10-29',
        enrollmentDeadline: '2021-10-29',
      }
    ]



    // for await (const courseScheduling of courseSchedulings) {
    //   const exists: any = await courseSchedulingService.findBy({
    //     query: QueryValues.ONE,
    //     where: [{field: 'moodle_id', value: courseScheduling.moodle_id}]
    //   })
    //   if (exists.status === 'success') courseScheduling['id'] = exists.scheduling._id

    //   const response:any = await courseSchedulingService.insertOrUpdate(courseScheduling)
    //   if (response.status === 'success') {
    //     course_scheduling_ids[response.scheduling.moodle_id] = response.scheduling._id
    //   }
    // }

    console.log('course_scheduling_ids', course_scheduling_ids)
  }

  // @end
}

export const initSeeder = new InitSeeder();
export { InitSeeder };
