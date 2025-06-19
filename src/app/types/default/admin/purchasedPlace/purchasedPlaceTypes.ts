// @import types
// @end

// @add your types
export enum PurchasedPlaceStatus {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export interface IPurchasedPlace {
  _id?: string;
  id?: string;
  transaction: string;
  buyer: string;
  courseScheduling: string;
  programCode: string;
  programName: string;
  status: PurchasedPlaceStatus;
  enrollment?: string;
  assignedTo?: string;
  assignedAt?: Date;
  expiresAt?: Date;
  metadata?: any;
}

export interface ICreatePurchasedPlacesFromTransaction {
  transactionId: string;
  userId?: string;
}

export interface IAssignPurchasedPlace {
  purchasedPlaceId: string;
  userId: string;
  enrollmentId?: string;
}

export interface IGetPurchasedPlaces {
  buyerId?: string;
  status?: PurchasedPlaceStatus | PurchasedPlaceStatus[];
  transactionId?: string;
  courseSchedulingId?: string;
  programCode?: string;
}
//@end