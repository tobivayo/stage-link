import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import {
  AuditAction,
  ProfileStatus,
  UserRoleStatus,
  Visibility,
} from '../../generated/prisma/enums';
import {
  CreateMusicianProfileDto,
  CreateProviderProfileDto,
  CreateVenueProfileDto,
  type LocationInputDto,
  type ProfileLinkInputDto,
  UpdateMusicianProfileDto,
  UpdateProviderProfileDto,
  UpdateVenueProfileDto,
} from './dto/profile-input.dto';

const profileInclude = { links: { orderBy: { createdAt: 'asc' as const } } };
const venueInclude = { ...profileInclude, location: true };
const providerInclude = { ...profileInclude, location: true };

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roles: { include: { role: true } },
        musicianProfile: { include: profileInclude },
        ownedVenues: { where: { deletedAt: null }, include: venueInclude },
        ownedProviders: { where: { deletedAt: null }, include: providerInclude },
        ownedBands: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
      },
    });
    if (!user) throw new NotFoundException('User was not found');
    return user;
  }

  async getMyMusician(userId: string) {
    const profile = await this.prisma.musicianProfile.findFirst({
      where: { userId, deletedAt: null },
      include: profileInclude,
    });
    if (profile) return { completionStatus: 'COMPLETE', profile };

    const assignment = await this.findRoleAssignment(userId, 'MUSICIAN');
    return {
      completionStatus:
        assignment?.status === UserRoleStatus.PENDING_PROFILE ? 'PENDING_PROFILE' : 'NOT_ENABLED',
      profile: null,
    };
  }

  async createMusician(userId: string, input: CreateMusicianProfileDto) {
    await this.requireRole(userId, ['MUSICIAN']);
    if (await this.prisma.musicianProfile.findFirst({ where: { userId, deletedAt: null } })) {
      throw new ConflictException('The musician profile already exists');
    }

    const { links, ...data } = input;
    return this.prisma.$transaction(async (transaction) => {
      const profile = await transaction.musicianProfile.create({
        data: {
          ...data,
          user: { connect: { id: userId } },
          instruments: this.normalizeTags(input.instruments),
          genres: this.normalizeTags(input.genres),
          influences: this.normalizeTags(input.influences ?? []),
          previousProjects: this.normalizeTags(input.previousProjects ?? []),
          status: ProfileStatus.ACTIVE,
          links: { create: this.linkCreates(links) },
        },
        include: profileInclude,
      });
      await this.activateRole(transaction, userId, 'MUSICIAN');
      await this.audit(transaction, userId, AuditAction.CREATE, 'MusicianProfile', profile.id, {
        visibility: profile.visibility,
      });
      return profile;
    });
  }

  async updateMusician(userId: string, input: UpdateMusicianProfileDto) {
    const current = await this.prisma.musicianProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Musician profile was not found');

    const { links, instruments, genres, influences, previousProjects, ...data } = input;
    return this.prisma.$transaction(async (transaction) => {
      const profile = await transaction.musicianProfile.update({
        where: { id: current.id },
        data: {
          ...data,
          instruments: instruments ? this.normalizeTags(instruments) : undefined,
          genres: genres ? this.normalizeTags(genres) : undefined,
          influences: influences ? this.normalizeTags(influences) : undefined,
          previousProjects: previousProjects ? this.normalizeTags(previousProjects) : undefined,
          links: links ? { deleteMany: {}, create: this.linkCreates(links) } : undefined,
        },
        include: profileInclude,
      });
      await this.audit(transaction, userId, AuditAction.UPDATE, 'MusicianProfile', profile.id, {
        changedFields: Object.keys(input),
      });
      return profile;
    });
  }

  async createVenue(userId: string, input: CreateVenueProfileDto) {
    await this.requireRole(userId, ['VENUE_ADMIN']);
    const { links, location, availability, ...data } = input;
    return this.prisma.$transaction(async (transaction) => {
      const profile = await transaction.venueProfile.create({
        data: {
          ...data,
          owner: { connect: { id: userId } },
          genres: this.normalizeTags(input.genres ?? []),
          equipment: this.normalizeTags(input.equipment ?? []),
          availability: availability as Prisma.InputJsonValue | undefined,
          status: ProfileStatus.ACTIVE,
          location: { create: this.locationCreate(location) },
          members: { create: { userId, role: 'OWNER' } },
          links: { create: this.linkCreates(links) },
        },
        include: venueInclude,
      });
      await this.activateRole(transaction, userId, 'VENUE_ADMIN');
      await this.audit(transaction, userId, AuditAction.CREATE, 'VenueProfile', profile.id, {
        visibility: profile.visibility,
      });
      return profile;
    });
  }

  getMyVenues(userId: string) {
    return this.prisma.venueProfile.findMany({
      where: { ownerUserId: userId, deletedAt: null },
      include: venueInclude,
      orderBy: { name: 'asc' },
    });
  }

  async updateVenue(userId: string, id: string, input: UpdateVenueProfileDto) {
    const current = await this.prisma.venueProfile.findFirst({
      where: { id, ownerUserId: userId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Venue was not found or is not administered by you');
    const { links, location, genres, equipment, availability, ...data } = input;

    return this.prisma.$transaction(async (transaction) => {
      if (location) {
        if (current.locationId) {
          await transaction.location.update({
            where: { id: current.locationId },
            data: this.locationCreate(location),
          });
        } else {
          const createdLocation = await transaction.location.create({
            data: this.locationCreate(location),
          });
          await transaction.venueProfile.update({
            where: { id },
            data: { locationId: createdLocation.id },
          });
        }
      }
      const profile = await transaction.venueProfile.update({
        where: { id },
        data: {
          ...data,
          genres: genres ? this.normalizeTags(genres) : undefined,
          equipment: equipment ? this.normalizeTags(equipment) : undefined,
          availability: availability as Prisma.InputJsonValue | undefined,
          links: links ? { deleteMany: {}, create: this.linkCreates(links) } : undefined,
        },
        include: venueInclude,
      });
      await this.audit(transaction, userId, AuditAction.UPDATE, 'VenueProfile', id, {
        changedFields: Object.keys(input),
      });
      return profile;
    });
  }

  async createProvider(userId: string, input: CreateProviderProfileDto) {
    await this.requireRole(userId, ['PROVIDER']);
    const { links, location, serviceTags, ...data } = input;
    return this.prisma.$transaction(async (transaction) => {
      const profile = await transaction.providerProfile.create({
        data: {
          ...data,
          owner: { connect: { id: userId } },
          serviceTags: this.normalizeTags(serviceTags),
          status: ProfileStatus.ACTIVE,
          location: location ? { create: this.locationCreate(location) } : undefined,
          members: { create: { userId, role: 'OWNER' } },
          links: { create: this.linkCreates(links) },
        },
        include: providerInclude,
      });
      await this.activateRole(transaction, userId, 'PROVIDER');
      await this.audit(transaction, userId, AuditAction.CREATE, 'ProviderProfile', profile.id, {
        visibility: profile.visibility,
      });
      return profile;
    });
  }

  getMyProviders(userId: string) {
    return this.prisma.providerProfile.findMany({
      where: { ownerUserId: userId, deletedAt: null },
      include: providerInclude,
      orderBy: { businessName: 'asc' },
    });
  }

  async updateProvider(userId: string, id: string, input: UpdateProviderProfileDto) {
    const current = await this.prisma.providerProfile.findFirst({
      where: { id, ownerUserId: userId, deletedAt: null },
    });
    if (!current) {
      throw new NotFoundException('Provider was not found or is not administered by you');
    }
    const { links, location, serviceTags, ...data } = input;
    return this.prisma.$transaction(async (transaction) => {
      if (location) {
        if (current.locationId) {
          await transaction.location.update({
            where: { id: current.locationId },
            data: this.locationCreate(location),
          });
        } else {
          const createdLocation = await transaction.location.create({
            data: this.locationCreate(location),
          });
          await transaction.providerProfile.update({
            where: { id },
            data: { locationId: createdLocation.id },
          });
        }
      }
      const profile = await transaction.providerProfile.update({
        where: { id },
        data: {
          ...data,
          serviceTags: serviceTags ? this.normalizeTags(serviceTags) : undefined,
          links: links ? { deleteMany: {}, create: this.linkCreates(links) } : undefined,
        },
        include: providerInclude,
      });
      await this.audit(transaction, userId, AuditAction.UPDATE, 'ProviderProfile', id, {
        changedFields: Object.keys(input),
      });
      return profile;
    });
  }

  async getVisibleProfile(type: string, id: string, viewerUserId: string | null) {
    if (!['musician', 'band', 'venue', 'provider'].includes(type)) {
      throw new NotFoundException('Profile type is not supported');
    }

    if (type === 'musician') {
      const profile = await this.prisma.musicianProfile.findFirst({
        where: { id, deletedAt: null },
        include: { ...profileInclude, user: { select: { firstName: true, lastName: true } } },
      });
      if (!profile) throw new NotFoundException('Profile was not found');
      const owner = viewerUserId === profile.userId;
      this.assertActive(profile.status, owner);
      this.assertVisible(profile.visibility, !!viewerUserId, owner);
      return {
        view: owner ? 'OWNER' : viewerUserId ? 'REGISTERED' : 'PUBLIC',
        type,
        id: profile.id,
        name: profile.stageName || `${profile.user.firstName} ${profile.user.lastName}`,
        bio: profile.bio,
        instruments: profile.instruments,
        genres: profile.genres,
        influences: viewerUserId ? profile.influences : undefined,
        experience: viewerUserId ? profile.experience : undefined,
        experienceLevel: profile.experienceLevel,
        availableForProjects: profile.availableForProjects,
        isSoloProject: profile.isSoloProject,
        photoUrl: profile.photoUrl,
        locationText: this.visibleValue(
          profile.locationText,
          profile.locationVisibility,
          !!viewerUserId,
          owner,
        ),
        links: this.visibleLinks(profile.links, !!viewerUserId, owner),
      };
    }

    if (type === 'band') {
      const profile = await this.prisma.bandProject.findFirst({
        where: { id, deletedAt: null },
        include: profileInclude,
      });
      if (!profile) throw new NotFoundException('Profile was not found');
      const owner = viewerUserId === profile.ownerUserId;
      this.assertActive(profile.status, owner);
      this.assertVisible(profile.visibility, !!viewerUserId, owner);
      return {
        view: owner ? 'OWNER' : viewerUserId ? 'REGISTERED' : 'PUBLIC',
        type,
        id: profile.id,
        name: profile.name,
        description: profile.description,
        genres: profile.genres,
        influences: viewerUserId ? profile.influences : undefined,
        imageUrl: profile.imageUrl,
        locationText: this.visibleValue(
          profile.locationText,
          profile.locationVisibility,
          !!viewerUserId,
          owner,
        ),
        links: this.visibleLinks(profile.links, !!viewerUserId, owner),
      };
    }

    if (type === 'venue') {
      const profile = await this.prisma.venueProfile.findFirst({
        where: { id, deletedAt: null },
        include: venueInclude,
      });
      if (!profile) throw new NotFoundException('Profile was not found');
      const owner = viewerUserId === profile.ownerUserId;
      this.assertActive(profile.status, owner);
      this.assertVisible(profile.visibility, !!viewerUserId, owner);
      return {
        view: owner ? 'OWNER' : viewerUserId ? 'REGISTERED' : 'PUBLIC',
        type,
        id: profile.id,
        name: profile.name,
        description: profile.description,
        capacity: profile.capacity,
        genres: profile.genres,
        equipment: viewerUserId ? profile.equipment : undefined,
        availability: profile.availability,
        validationStatus: profile.validationStatus,
        location: this.visibleValue(
          profile.location,
          profile.addressVisibility,
          !!viewerUserId,
          owner,
        ),
        contact: this.visibleValue(
          this.contact(profile),
          profile.contactVisibility,
          !!viewerUserId,
          owner,
        ),
        links: this.visibleLinks(profile.links, !!viewerUserId, owner),
      };
    }

    const profile = await this.prisma.providerProfile.findFirst({
      where: { id, deletedAt: null },
      include: providerInclude,
    });
    if (!profile) throw new NotFoundException('Profile was not found');
    const owner = viewerUserId === profile.ownerUserId;
    this.assertActive(profile.status, owner);
    this.assertVisible(profile.visibility, !!viewerUserId, owner);
    return {
      view: owner ? 'OWNER' : viewerUserId ? 'REGISTERED' : 'PUBLIC',
      type,
      id: profile.id,
      name: profile.businessName,
      description: profile.description,
      serviceTags: profile.serviceTags,
      coverageArea: profile.coverageArea,
      location: this.visibleValue(
        profile.location,
        profile.addressVisibility,
        !!viewerUserId,
        owner,
      ),
      contact: this.visibleValue(
        this.contact(profile),
        profile.contactVisibility,
        !!viewerUserId,
        owner,
      ),
      links: this.visibleLinks(profile.links, !!viewerUserId, owner),
    };
  }

  private async requireRole(userId: string, codes: string[]): Promise<void> {
    const assignment = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: { code: { in: codes } },
        status: { in: [UserRoleStatus.ACTIVE, UserRoleStatus.PENDING_PROFILE] },
      },
    });
    if (!assignment)
      throw new ForbiddenException(`One of these roles is required: ${codes.join(', ')}`);
  }

  private findRoleAssignment(userId: string, code: string) {
    return this.prisma.userRole.findFirst({ where: { userId, role: { code } } });
  }

  private async activateRole(
    transaction: Prisma.TransactionClient,
    userId: string,
    code: string,
  ): Promise<void> {
    await transaction.userRole.updateMany({
      where: { userId, role: { code }, status: UserRoleStatus.PENDING_PROFILE },
      data: { status: UserRoleStatus.ACTIVE, deactivatedAt: null },
    });
  }

  private audit(
    transaction: Prisma.TransactionClient,
    actorUserId: string,
    action: AuditAction,
    entityType: string,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return transaction.auditLog.create({
      data: { actorUserId, action, entityType, entityId, metadata },
    });
  }

  private normalizeTags(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
  }

  private linkCreates(links: ProfileLinkInputDto[] = []) {
    return links.map((link) => ({ ...link, label: link.label.trim(), url: link.url.trim() }));
  }

  private locationCreate(location: LocationInputDto) {
    return { ...location, countryCode: location.countryCode.toUpperCase() };
  }

  private assertVisible(visibility: Visibility, registered: boolean, owner: boolean): void {
    if (owner) return;
    if (
      visibility === Visibility.PRIVATE ||
      (visibility === Visibility.REGISTERED_ONLY && !registered)
    ) {
      throw new NotFoundException('Profile was not found');
    }
  }

  private assertActive(status: string, owner: boolean): void {
    if (!owner && status !== ProfileStatus.ACTIVE && status !== 'ACTIVE') {
      throw new NotFoundException('Profile was not found');
    }
  }

  private visibleValue<T>(
    value: T,
    visibility: Visibility,
    registered: boolean,
    owner: boolean,
  ): T | undefined {
    if (
      owner ||
      visibility === Visibility.PUBLIC ||
      (registered && visibility === Visibility.REGISTERED_ONLY)
    ) {
      return value;
    }
    return undefined;
  }

  private visibleLinks(
    links: Array<{ label: string; url: string; visibility: Visibility }>,
    registered: boolean,
    owner: boolean,
  ) {
    return links.filter(
      (link) =>
        owner ||
        link.visibility === Visibility.PUBLIC ||
        (registered && link.visibility === Visibility.REGISTERED_ONLY),
    );
  }

  private contact(profile: {
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  }) {
    return {
      name: profile.contactName,
      email: profile.contactEmail,
      phone: profile.contactPhone,
    };
  }
}
