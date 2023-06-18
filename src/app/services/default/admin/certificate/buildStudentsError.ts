export class BuildStudentsMoodleDataException extends Error {
  public readonly errorKey: string = '';
  public readonly customParams: any = {};

  constructor({errorKey,customParams}: {errorKey?: string, customParams?: any}) {
    super();

    this.errorKey = errorKey || 'fail_request';
    this.customParams = customParams
  }
}
