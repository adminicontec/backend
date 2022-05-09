export interface ISendNotificationParticipantCertificated {
  courseSchedulingId: string,
  participantId: string
}


export interface IParticipantData {
  participantId: string,
  participantFullName: string,
  courseSchedulingName: string,
  courseSchedulingId: string,
  certificateType: string
}

export interface ISendNotificationAssistantCertificateGeneration {
  auxiliarId: string
  participants: IParticipantData[]
}
