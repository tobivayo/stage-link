import type { Visibility } from '../enums/visibility.enum.js';

export type CallStatusValue = 'OPEN' | 'IN_REVIEW' | 'CLOSED' | 'COMPLETED' | 'CANCELLED';
export type CallType =
  'VENUE_DATE' | 'FESTIVAL' | 'SUPPORT_BAND' | 'PRIVATE_EVENT' | 'COLLABORATION' | 'OTHER';
export type CallOrganizerType = 'USER' | 'MUSICIAN' | 'BAND_PROJECT' | 'VENUE' | 'PRODUCER';
export type CallApplicantType = 'MUSICIAN' | 'BAND_PROJECT';
export type CallApplicationStatus =
  'PENDING' | 'REVIEWED' | 'PRESELECTED' | 'SELECTED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAWN';
export type CallConfirmationStatus = 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'DECLINED';

export interface CallDto {
  id: string;
  creatorUserId: string;
  organizerType: CallOrganizerType;
  type: CallType;
  title: string;
  description: string;
  eventName: string | null;
  proposedDateTime: string;
  closesAt: string | null;
  locationText: string | null;
  genres: string[];
  preferredStyles: string[];
  maxSelectedApplicants: number;
  offeredConditions: string | null;
  estimatedPayment: string | null;
  currency: string | null;
  technicalRequirements: string | null;
  visibility: Visibility;
  status: CallStatusValue;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  view: 'PUBLIC' | 'REGISTERED' | 'OWNER';
  isOwner: boolean;
  musicianProfile?: { id: string; stageName: string | null; photoUrl: string | null } | null;
  bandProject?: { id: string; name: string; imageUrl: string | null } | null;
  venueProfile?: { id: string; name: string } | null;
  _count?: { applications: number };
}

export interface CallApplicationDto {
  id: string;
  callId: string;
  submittedByUserId: string;
  applicantType: CallApplicantType;
  message: string | null;
  technicalNeeds: string | null;
  requestedPayment: string | null;
  currency: string | null;
  status: CallApplicationStatus;
  createdAt: string;
  call: {
    id: string;
    title: string;
    proposedDateTime: string;
    status: CallStatusValue;
    creatorUserId: string;
    maxSelectedApplicants: number;
  };
  applicant: {
    id: string;
    name: string;
    type: CallApplicantType;
    genres: string[];
    instruments: string[];
    experience: string | null;
    experienceLevel: string | null;
    locationText: string | null;
    photoUrl: string | null;
    portfolio: Array<{
      id: string;
      title: string;
      type: string;
      url: string;
      description: string | null;
    }>;
  } | null;
  confirmation?: CallConfirmationDto | null;
}

export interface CallConfirmationDto {
  id: string;
  callId: string;
  applicationId: string;
  confirmerUserId: string;
  status: CallConfirmationStatus;
  confirmedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
}

export interface CallStatusHistoryDto {
  id: string;
  callId: string;
  previousStatus: CallStatusValue | null;
  newStatus: CallStatusValue;
  reason: string | null;
  createdAt: string;
}
