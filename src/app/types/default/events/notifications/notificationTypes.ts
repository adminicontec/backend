export interface ISendNotificationParticipantCertificated {
  certificateQueueId: string,
  courseSchedulingId: string,
  participantId: string,
  consecutive: string,
  forceNotificationSended?: boolean
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

export interface ISendNotification2FA {
  user: {
    _id: string;
    firstName: string;
    email: string;
  },
  duration: number,
  token: string;
}


export interface ISendNotificationConfirmEmail {
  user: {
    _id: string;
    firstName: string;
    email: string;
    username: string;
  },
  duration: number,
  token: string;
  redirect?: string
}

export interface ISendNotificationEnrollmentTrackingEmailData {
  studentName: string;
  error: string;
  studentFullName: string;
  studentEmail: string;
  studentDocumentId: string;
  studentPhoneNumber: string;
  courseSchedulingServiceId: string;
  origin: string;
  mailer?: any
}

export interface ISendNotificationEnrollmentTracking {
  recipients: string[],
  recipientsCC?: string[],
  emailData: ISendNotificationEnrollmentTrackingEmailData
}
