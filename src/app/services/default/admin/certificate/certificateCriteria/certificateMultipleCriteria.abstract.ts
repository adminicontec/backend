export abstract class ICertificateMultipleCriteria {
  abstract evaluateCriteria(): Promise<boolean>
}
