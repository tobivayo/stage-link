import type { RoleCode } from './auth.types.js';
import type { Visibility } from '../enums/visibility.enum.js';

export interface ProfileLinkDto {
  id?: string;
  label: string;
  url: string;
  visibility?: Visibility;
}

export interface MusicianProfileDto {
  id: string;
  stageName: string | null;
  bio: string | null;
  instruments: string[];
  genres: string[];
  influences: string[];
  experience: string | null;
  previousProjects: string[];
  availableForProjects: boolean;
  isSoloProject: boolean;
  locationText: string | null;
  photoUrl: string | null;
  visibility: Visibility;
  locationVisibility: Visibility;
  status: string;
  links: ProfileLinkDto[];
}

export interface BandProjectDto {
  id: string;
  ownerUserId: string;
  name: string;
  description: string | null;
  genres: string[];
  influences: string[];
  locationText: string | null;
  imageUrl: string | null;
  visibility: Visibility;
  locationVisibility: Visibility;
  status: string;
  links?: ProfileLinkDto[];
  _count?: { members: number };
}

export interface BandMemberDto {
  id: string;
  role: 'ADMIN' | 'MEMBER' | 'REPRESENTATIVE';
  instrument: string | null;
  joinedAt: string;
  user: { id: string; firstName: string; lastName: string };
}

export interface BandInvitationDto {
  id: string;
  role: 'MEMBER' | 'REPRESENTATIVE';
  instrument: string | null;
  message: string | null;
  status: string;
  band?: { id: string; name: string; imageUrl: string | null };
}

export interface VenueProfileDto {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  genres: string[];
  equipment: string[];
  availability?: { notes?: string } | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactVisibility?: Visibility;
  addressVisibility?: Visibility;
  visibility: Visibility;
  validationStatus: string;
  location?: LocationDto | null;
  links?: ProfileLinkDto[];
}

export interface ProviderProfileDto {
  id: string;
  businessName: string;
  description: string | null;
  serviceTags: string[];
  coverageArea: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactVisibility?: Visibility;
  visibility: Visibility;
  links?: ProfileLinkDto[];
}

export interface LocationDto {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  countryCode: string;
}

export interface PortfolioItemDto {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'LINK' | 'DOCUMENT';
  title: string;
  description: string | null;
  url: string;
  visibility: Visibility;
  sortOrder: number;
  bandProject?: { id: string; name: string } | null;
}

export interface MyProfilesDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Array<{ status: string; role: { code: RoleCode } }>;
  musicianProfile: MusicianProfileDto | null;
  ownedVenues: VenueProfileDto[];
  ownedProviders: ProviderProfileDto[];
  ownedBands: BandProjectDto[];
}

export interface PublicProfileDto {
  view: 'PUBLIC' | 'REGISTERED' | 'OWNER';
  type: 'musician' | 'band' | 'venue' | 'provider';
  id: string;
  name: string;
  description?: string | null;
  bio?: string | null;
  genres?: string[];
  instruments?: string[];
  serviceTags?: string[];
  locationText?: string | null;
  photoUrl?: string | null;
  imageUrl?: string | null;
  links?: ProfileLinkDto[];
}
