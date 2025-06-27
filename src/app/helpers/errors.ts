export class ExceptionsService extends Error {
  declare code: string | number;
  declare extra: any | undefined;
  declare status: string;
  constructor({
    message,
    code,
    extra,
  }: {
    message: string;
    code?: string | number;
    extra?: any;
  }) {
    super(message);
    this.name = this.constructor.name;
    this.code = code || 405;
    this.extra = extra || undefined;
  }
}
