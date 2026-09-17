import type { ExperienceLevel } from './profile.types.js';
import type { Visibility } from '../enums/visibility.enum.js';

export type MusicianSearchSort = 'COMPATIBILITY' | 'LOCATION' | 'EXPERIENCE' | 'RECENT';
export type SearchModality = 'IN_PERSON' | 'REMOTE' | 'HYBRID';
export type MemberSearchStatus = 'OPEN' | 'PAUSED' | 'CLOSED' | 'CANCELLED';
export type MemberSearchApplicationStatus =
  'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type RecommendationDecision = 'INTERESTED' | 'DISMISSED';

export interface MusicianSearchResultDto {
  id: string;
  displayName: string;
  bio: string | null;
  instruments: string[];
  genres: string[];
  experienceLevel: ExperienceLevel | null;
  availableForProjects: boolean;
  photoUrl: string | null;
  locationText?: string | null;
  compatibilityScore: number;
  compatibilityReasons: string[];
}

export interface PaginatedDto<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  candidateLimitReached?: boolean;
}

export interface MemberSearchDto {
  id: string;
  creatorUserId: string;
  title: string;
  description: string;
  requiredInstrument: string;
  genres: string[];
  desiredExperience: ExperienceLevel | null;
  expectedAvailability: string | null;
  locationText: string | null;
  modality: SearchModality;
  visibility: Visibility;
  status: MemberSearchStatus;
  createdAt: string;
  updatedAt: string;
  bandProject?: { id: string; name: string; imageUrl: string | null } | null;
  musicianProfile?: {
    id: string;
    stageName: string | null;
    photoUrl: string | null;
    user: { firstName: string; lastName: string };
  } | null;
  _count?: { applications: number };
  view?: 'PUBLIC' | 'REGISTERED' | 'OWNER';
}

export interface MemberSearchApplicationDto {
  id: string;
  message: string | null;
  status: MemberSearchApplicationStatus;
  createdAt: string;
  search: {
    id: string;
    title: string;
    status: MemberSearchStatus;
    bandProject?: { id: string; name: string } | null;
  };
  musicianProfile: {
    id: string;
    stageName: string | null;
    instruments: string[];
    genres: string[];
    experienceLevel: ExperienceLevel | null;
    photoUrl: string | null;
    user: { firstName: string; lastName: string };
  };
}
