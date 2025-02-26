import { ClerkClient } from '@clerk/backend';
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  AlreadyRegisteredException,
  ForbiddenTournamentAccessException,
  MaxParticipantsReachedException,
  NotRegisteredException,
  TournamentNotFoundException,
} from 'src/common/exceptions/tournaments.exceptions';
import { FilesService } from 'src/files/files.service';
import { TournamentDto } from './dto/tournaments.dto';
import { FilterTournamentsDto } from './dto/filters.dto';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationDto } from './dto/pagination.dto';
import { SortTournamentsDto } from './dto/sort.dto';
import { TournamentStatus } from 'src/common/types/tournament.types';

type TornamentPayload = Prisma.TournamentGetPayload<{
  include: {
    images: true;
    user: true;
    participants: { include: { user: true } };
  };
}>;

type TournamentModel = Omit<
  TornamentPayload,
  | 'latitude'
  | 'longitude'
  | 'minAge'
  | 'maxAge'
  | 'user'
  | 'participants'
  | 'joinedAt'
> & {
  geoCoordinates: {
    latitude: number;
    longitude: number;
  };
  ageRestrictions?: { minAge: number | null; maxAge: number | null };
  organizer: TornamentPayload['user'];
  participants: Pick<
    TornamentPayload['user'],
    'email' | 'firstName' | 'lastName' | 'id' | 'imageUrl'
  >[];
  status: TournamentStatus;
  participantsCount: number;
  role: 'participant' | 'organizer' | null;
  joinedCreatedAt?: Date;
};

type TournamentBaseModel = Pick<
  TournamentModel,
  | 'createdAt'
  | 'updatedAt'
  | 'id'
  | 'title'
  | 'description'
  | 'dateStart'
  | 'dateEnd'
  | 'location'
  | 'maxParticipants'
  | 'images'
  | 'entryFee'
  | 'prizePool'
  | 'sportType'
  | 'isActive'
  | 'geoCoordinates'
  | 'status'
  | 'participantsCount'
  | 'role'
  | 'joinedCreatedAt'
  | 'isApproved'
>;

export class QueryTournamentsDto extends IntersectionType(
  FilterTournamentsDto,
  IntersectionType(PaginationDto, SortTournamentsDto),
) {}

@Injectable()
export class TournamentsService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Inject('ClerkClient')
    private readonly clerkClient: ClerkClient,
    private readonly filesService: FilesService,
  ) {
    super({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async getTournamentIdsByLocation(location: {
    lat: number;
    lng: number;
    radius: number;
  }): Promise<string[]> {
    const radiusInMeters = location.radius * 1000;

    const spatialResult: Array<{ id: string }> = await this.$queryRaw`
      SELECT t.id
      FROM "tournaments" t
      WHERE ST_DWithin(
        t.coordinates::geography,
        ST_SetSRID(ST_MakePoint(${Number(location.lng)}, ${Number(location.lat)}), 4326)::geography,
        ${radiusInMeters}
      )
    `;
    return spatialResult.map((row) => row.id);
  }

  async getTournaments(filters: QueryTournamentsDto, userId: string) {
    const { page = 1, limit = 10, lat, lng, radius } = filters;
    const skip = (page - 1) * limit;

    let spatialFilter = {};

    if (lat && lng && radius) {
      const tournamentIds = await this.getTournamentIdsByLocation({
        lat,
        lng,
        radius,
      });
      spatialFilter = { id: { in: tournamentIds } };
    }

    const tournaments = await this.tournament.findMany({
      include: {
        images: true,
        user: true,
        participants: { include: { user: true } },
      },
      where: {
        isActive: true,
        isApproved: true,
        ...spatialFilter,
        sportType: filters.sportType?.length
          ? { in: filters.sportType }
          : undefined,
        skillLevel: filters.skillLevel?.length
          ? { in: filters.skillLevel }
          : undefined,
        prizePool: {
          gte: filters.prizePool?.min,
          lte: filters.prizePool?.max,
        },
        entryFee: {
          gte: filters.entryFee?.min,
          lte: filters.entryFee?.max,
        },
        title: filters.search
          ? { contains: filters.search, mode: 'insensitive' }
          : undefined,
        AND: filters.date
          ? [
              {
                dateStart: {
                  lte: new Date(filters.date.setHours(23, 59, 59, 999)),
                },
                dateEnd: { gte: new Date(filters.date.setHours(0, 0, 0, 0)) },
              },
            ]
          : [{ dateStart: { gte: new Date() } }],
      },
      orderBy: filters.sortBy
        ? { [filters.sortBy]: filters.sortOrder || 'asc' }
        : { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return tournaments.map((tournament) =>
      this.mapToBaseModel(tournament, userId),
    );
  }

  async addLocation(
    data: {
      latitude: number;
      longitude: number;
    },
    tournamentId: string,
  ): Promise<string> {
    const pointWKT = `SRID=4326;POINT(${data.longitude} ${data.latitude})`;

    const tournamentResponseId: string = await this.$queryRaw`
      UPDATE "tournaments"
      SET "coordinates" = ST_GeomFromText(${pointWKT}, 4326)
      WHERE "id" = ${tournamentId}::uuid
      RETURNING id;
    `;
    return tournamentResponseId;
  }

  async createTournament(data: TournamentDto, userId: string) {
    const { geoCoordinates, ageRestrictions, images, ...rest } = data;
    const transformedImages = await this.filesService.transformImages(images);

    const tournament = await this.tournament.create({
      data: {
        ...rest,
        isApproved: true,
        latitude: geoCoordinates.latitude,
        longitude: geoCoordinates.longitude,
        minAge: ageRestrictions?.minAge,
        maxAge: ageRestrictions?.maxAge,
        images: {
          create: transformedImages,
        },
        createdBy: userId,
      },
    });
    await this.addLocation(geoCoordinates, tournament.id);

    return await this.getTournamentById(tournament.id, userId);
  }
  async getCreatedTournaments(
    userId: string,
    isFinished: boolean,
  ): Promise<(TornamentPayload & { dateSort: Date })[]> {
    const tournaments = await this.tournament.findMany({
      include: {
        images: true,
        participants: {
          include: { user: true },
        },
        user: true,
      },
      where: {
        createdBy: userId,
        AND: [
          isFinished
            ? {
                OR: [{ dateEnd: { lte: new Date() } }, { isActive: false }],
              }
            : {
                dateEnd: { gt: new Date() },
                isActive: true,
              },
        ],
      },
    });

    return tournaments.map((t) => ({
      ...t,
      dateSort: t.createdAt,
    }));
  }

  async getParticipatedTournaments(
    userId: string,
    isFinished: boolean,
  ): Promise<(TornamentPayload & { dateSort: Date })[]> {
    const tournaments = await this.tournament.findMany({
      include: {
        images: true,
        participants: {
          include: { user: true },
        },
        user: true,
      },
      where: {
        isActive: true,
        isApproved: true,
        participants: { some: { userId } },
        AND: [
          isFinished
            ? {
                OR: [{ dateEnd: { lte: new Date() } }, { isActive: false }],
              }
            : {
                dateEnd: { gt: new Date() },
                isActive: true,
              },
        ],
      },
    });

    return tournaments.map((t) => ({
      ...t,
      dateSort:
        t.participants.find((p) => p.userId === userId)?.joinedAt ??
        new Date(0),
    }));
  }

  async getMyTournaments(
    userId: string,
    isFinished: boolean,
  ): Promise<TournamentBaseModel[]> {
    const createdTournaments = await this.getCreatedTournaments(
      userId,
      isFinished,
    );
    const participatedTournaments = await this.getParticipatedTournaments(
      userId,
      isFinished,
    );

    const tournamentMap = new Map<
      string,
      TornamentPayload & { dateSort: Date }
    >();

    createdTournaments.forEach((tournament) => {
      tournamentMap.set(tournament.id, tournament);
    });

    participatedTournaments.forEach((tournament) => {
      if (!tournamentMap.has(tournament.id)) {
        tournamentMap.set(tournament.id, tournament);
      }
    });

    const tournaments = Array.from(tournamentMap.values()).sort(
      (a, b) => b.dateSort.getTime() - a.dateSort.getTime(),
    );

    return tournaments.map((tournament) =>
      this.mapToBaseModel(tournament, userId),
    );
  }

  async getTournamentById(
    id: string,
    userId?: string,
  ): Promise<TournamentModel> {
    const tournamentRecord = await this.tournament.findUnique({
      where: { id },
      include: {
        images: true,
        user: true,
        participants: {
          include: { user: true },
        },
      },
    });

    if (!tournamentRecord) {
      throw new TournamentNotFoundException();
    }
    return this.mapToFullModel(tournamentRecord, userId);
  }

  async updateTournament(
    id: string,
    userId: string,
    data: TournamentDto,
  ): Promise<TournamentModel> {
    const { geoCoordinates, ageRestrictions, images, ...rest } = data;

    const tournamentRecord = await this.ensureTournamentExists(id);
    this.validateTournamentOwnership(tournamentRecord, userId);

    const transformedimages = await this.filesService.transformImages(images);
    await this.image.deleteMany({
      where: { tournamentId: id },
    });

    const tournament = await this.tournament.update({
      where: { id },
      data: {
        ...rest,
        latitude: geoCoordinates.latitude,
        longitude: geoCoordinates.longitude,
        minAge: ageRestrictions?.minAge,
        maxAge: ageRestrictions?.maxAge,
        images: {
          create: transformedimages,
        },
        isApproved: true,
      },
      include: {
        participants: {
          include: { user: true },
        },
        user: true,
        images: true,
      },
    });
    await this.addLocation(geoCoordinates, tournament.id);

    return this.mapToFullModel(tournament, userId);
  }

  async deleteTournament(
    id: string,
    userId: string,
  ): Promise<{ message: string } | null> {
    const tournamentRecord = await this.ensureTournamentExists(id);
    this.validateTournamentOwnership(tournamentRecord, userId);

    await this.image.deleteMany({
      where: { tournamentId: id },
    });

    await this.tournamentParticipant.deleteMany({
      where: {
        tournamentId: id,
      },
    });

    await this.tournament.delete({
      where: { id },
    });

    return { message: 'Tournament was deleted succesfully' };
  }

  async register(id: string, userId: string): Promise<TournamentModel | null> {
    const tournamentRecord = await this.ensureTournamentExists(id);
    this.ensureTournamentActive(tournamentRecord);
    this.validateUserParticipation(tournamentRecord, userId, true);
    this.validateMaxNotExceeded(tournamentRecord);

    await this.tournamentParticipant.create({
      data: {
        userId,
        tournamentId: id,
      },
    });

    return this.getTournamentById(id, userId);
  }

  async leave(id: string, userId: string): Promise<TournamentModel | null> {
    const tournamentRecord = await this.ensureTournamentExists(id);
    this.validateUserParticipation(tournamentRecord, userId, false);

    await this.tournamentParticipant.delete({
      where: {
        tournamentId_userId: { tournamentId: id, userId },
      },
    });

    return this.getTournamentById(id, userId);
  }

  async removeUser(
    id: string,
    userId: string,
    participantId: string,
  ): Promise<TournamentModel | null> {
    const tournamentRecord = await this.ensureTournamentExists(id);
    this.validateTournamentOwnership(tournamentRecord, userId);
    this.validateUserParticipation(tournamentRecord, participantId, false);

    await this.tournamentParticipant.deleteMany({
      where: {
        tournamentId: id,
        userId: participantId,
      },
    });

    return this.getTournamentById(id, userId);
  }

  async updateStatus(
    id: string,
    userId: string,
    isActive: boolean,
  ): Promise<TournamentModel> {
    const tournamentRecord = await this.ensureTournamentExists(id);
    this.validateTournamentOwnership(tournamentRecord, userId);

    const tournament = await this.tournament.update({
      where: { id },
      data: {
        isActive,
      },
      include: {
        participants: {
          include: { user: true },
        },
        user: true,
        images: true,
      },
    });

    return this.mapToFullModel(tournament, userId);
  }

  // Helper functions

  async ensureTournamentExists(id: string): Promise<TournamentModel> {
    const tournament = await this.getTournamentById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }
    return tournament;
  }

  ensureTournamentActive(tournament: TournamentModel): TournamentModel {
    const tournamentStatus = this.computeStatus(tournament);
    if (
      !tournament.isActive ||
      tournamentStatus === TournamentStatus.FINISHED ||
      !tournament.isApproved
    ) {
      throw new TournamentNotFoundException();
    }
    return tournament;
  }

  validateMaxNotExceeded(tournament: TournamentModel): TournamentModel {
    if (tournament?.participants[tournament.maxParticipants! - 1]) {
      throw new MaxParticipantsReachedException();
    }
    return tournament;
  }

  validateUserParticipation(
    tournament: TournamentModel,
    userId: string,
    shouldBeRegisted: boolean,
  ): TournamentModel {
    const isUserParticipating = tournament.participants
      .map((p) => p.id)
      .includes(userId);

    if (isUserParticipating && shouldBeRegisted) {
      throw new AlreadyRegisteredException();
    }
    if (!isUserParticipating && !shouldBeRegisted) {
      throw new NotRegisteredException();
    }
    return tournament;
  }

  validateTournamentOwnership(
    tournament: TournamentModel,
    userId: string,
  ): TournamentModel {
    if (tournament.createdBy !== userId) {
      throw new ForbiddenTournamentAccessException();
    }
    return tournament;
  }

  computeStatus = (
    tournament: TornamentPayload | TournamentModel,
  ): TournamentStatus => {
    const now = new Date();
    if (now < tournament.dateStart) return TournamentStatus.UPCOMING;
    if (now >= tournament.dateStart && now < tournament.dateEnd)
      return TournamentStatus.ONGOING;
    return TournamentStatus.FINISHED;
  };

  computeRole = (
    tournament: TornamentPayload,
    userId?: string,
  ): TournamentModel['role'] => {
    if (!userId) return null;
    const isParticipant =
      tournament.participants.filter((p) => p.user.id === userId).length !== 0;
    const isOrganizer = tournament.createdBy === userId;
    return isOrganizer ? 'organizer' : isParticipant ? 'participant' : null;
  };

  // Mapping from Payload to model

  mapToBaseModel = (
    tournament: TornamentPayload & { dateSort?: Date },
    userId?: string,
  ): TournamentBaseModel => {
    return {
      id: tournament.id,
      title: tournament.title,
      description: tournament.description,
      dateStart: tournament.dateStart,
      dateEnd: tournament.dateEnd,
      location: tournament.location,
      maxParticipants: tournament.maxParticipants,
      createdAt: tournament.createdAt,
      updatedAt: tournament.updatedAt,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      images: tournament.images,
      participantsCount: tournament.participants.length,
      sportType: tournament.sportType,
      isActive: tournament.isActive,
      role: this.computeRole(tournament, userId),
      geoCoordinates: {
        latitude: tournament.latitude,
        longitude: tournament.longitude,
      },
      status: this.computeStatus(tournament),
      joinedCreatedAt: tournament.dateSort,
      isApproved: tournament.isApproved,
    };
  };

  mapToFullModel = (
    tournament: TornamentPayload & { dateSort?: Date },
    userId?: string,
  ): TournamentModel => {
    const { latitude, longitude, minAge, maxAge, user, participants, ...rest } =
      tournament;

    return {
      ...rest,
      geoCoordinates: {
        latitude,
        longitude,
      },
      ageRestrictions: { minAge, maxAge },
      organizer: { ...user },
      status: this.computeStatus(tournament),
      role: this.computeRole(tournament, userId),
      participantsCount: participants.length,
      participants: participants
        .filter((p) => p.user)
        .map(({ user }) => {
          return {
            email: user.email,
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            // phoneNumber: user.phoneNumber,
          };
        }),
      joinedCreatedAt:
        tournament.dateSort ||
        tournament.participants.find((p) => p.user.id === userId)?.joinedAt ||
        tournament.createdAt,
    };
  };
}
