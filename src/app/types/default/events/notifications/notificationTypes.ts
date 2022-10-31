export interface ISendNotificationParticipantCertificated {
  certificateQueueId: string,
  courseSchedulingId: string,
  participantId: string,
  consecutive: string
}


export interface IParticipantData {
  serviceId?: string,
  participantId: string,
  participantFullName: string,
  certificationName: string,
  certificateType?: string,
  document: string,
  regional: string
}

export interface IParticipantDataByCertificateType {
  participants: IParticipantData[],
  serviceId: string,
}

export interface ISendNotificationAssistantCertificateGeneration {
  auxiliarId: string,
  serviceId: string,
  programName: string
  certifications: IParticipantData[]
}
