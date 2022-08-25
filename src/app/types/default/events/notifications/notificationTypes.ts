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
  courseSchedulingName: string,
  courseSchedulingId: string,
  certificateType?: string,
  document: string,
  regional: string
}

export interface IParticipantDataByCertificateType {
  certificateName: string,
  participants: IParticipantData[]
}

export interface ISendNotificationAssistantCertificateGeneration {
  auxiliarId: string,
  participants: IParticipantDataByCertificateType[],
  serviceId: string
}
