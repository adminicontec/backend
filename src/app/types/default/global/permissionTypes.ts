export interface IModulePermission{
  name: string
  description: string
  permissions?: {
    name: string
    description: string
  }[]
}
