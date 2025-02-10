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
  include: { images: true; participants: true; user: true };
}>;

type TournamentModel = Omit<
  TornamentPayload,
  'latitude' | 'longitude' | 'minAge' | 'maxAge' | 'user' | 'participants'
> & {
  geoCoordinates: {
    latitude: number;
    longitude: number;
  };
  ageRestrictions?: { minAge: number | null; maxAge: number | null };
  organizer: TornamentPayload['user'];
  participants: Omit<TornamentPayload['user'], 'phoneNumber'>[];
  status: TournamentStatus;
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
> & {
  participants: string[];
  status: TournamentStatus;
};

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

  async getTournaments(filters: QueryTournamentsDto) {
    const { page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const tournaments = await this.tournament.findMany({
      include: {
        images: true,
        participants: true,
      },
      where: {
        isActive: true,
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
          ? {
              contains: filters.search,
              mode: 'insensitive',
            }
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
          : [
              {
                dateStart: { gte: new Date() },
              },
            ],
      },
      orderBy: filters.sortBy
        ? { [filters.sortBy]: filters.sortOrder || 'asc' }
        : { createdAt: 'desc' },
      skip,
      take: limit,
    });
    return tournaments.map(this.mapToBaseModel);
  }

  async createTournament(userId: string, data: TournamentDto) {
    const { geoCoordinates, ageRestrictions, images, ...rest } = data;

    const transformedimages = await this.filesService.transformImages(images);

    const tournament = await this.tournament.create({
      data: {
        ...rest,
        latitude: geoCoordinates.latitude,
        longitude: geoCoordinates.longitude,
        minAge: ageRestrictions?.minAge,
        maxAge: ageRestrictions?.maxAge,
        images: {
          create: transformedimages,
        },
        user: {
          connect: { id: userId },
        },
      },
    });

    return await this.getTournamentById(tournament.id);
  }

  async getCreatedTournaments(userId: string): Promise<TournamentBaseModel[]> {
    const tournaments = await this.tournament.findMany({
      include: {
        images: true,
        participants: true,
      },
      where: {
        createdBy: userId,
      },
    });

    return tournaments.map(this.mapToBaseModel);
  }

  async getParticipatedTournaments(
    userId: string,
  ): Promise<TournamentBaseModel[]> {
    const tournaments = await this.tournament.findMany({
      include: {
        images: true,
        participants: true,
      },
      where: {
        isActive: true,
        participants: { some: { id: userId } },
      },
    });

    return tournaments.map(this.mapToBaseModel);
  }

  async getTournamentById(id: string): Promise<TournamentModel> {
    const tournamentRecord = await this.tournament.findUnique({
      where: { id },
      include: {
        images: true,
        user: true,
        participants: true,
      },
    });

    if (!tournamentRecord) {
      throw new TournamentNotFoundException();
    }
    return this.mapToFullModel(tournamentRecord);
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
      },
      include: {
        participants: true,
        user: true,
        images: true,
      },
    });

    return this.mapToFullModel(tournament);
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

    await this.tournament.delete({
      where: { id },
    });

    return { message: 'Tournament was deleted succesfully' };
  }

  async register(id: string, userId: string): Promise<TournamentModel | null> {
    const tournamentRecord = await this.ensureTournamentExists(id);
    this.validateUserParticipation(tournamentRecord, userId, true);
    this.validateMaxNotExceeded(tournamentRecord);

    const tournament = await this.tournament.update({
      where: { id },
      data: { participants: { connect: { id: userId } } },
      include: {
        participants: true,
        user: true,
        images: true,
      },
    });

    return this.mapToFullModel(tournament);
  }

  async leave(id: string, userId: string): Promise<TournamentModel | null> {
    const tournamentRecord = await this.ensureTournamentExists(id);
    this.validateUserParticipation(tournamentRecord, userId, false);

    const tournament = await this.tournament.update({
      where: { id },
      data: { participants: { disconnect: { id: userId } } },
      include: {
        participants: true,
        user: true,
        images: true,
      },
    });

    return this.mapToFullModel(tournament);
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
        participants: true,
        user: true,
        images: true,
      },
    });

    return this.mapToFullModel(tournament);
  }

  async removeUser(
    id: string,
    userId: string,
    participantId: string,
  ): Promise<TournamentModel | null> {
    const tournamentRecord = await this.ensureTournamentExists(id);
    this.validateTournamentOwnership(tournamentRecord, userId);
    this.validateUserParticipation(tournamentRecord, participantId, false);

    const tournament = await this.tournament.update({
      where: { id },
      data: { participants: { disconnect: { id: participantId } } },
      include: {
        participants: true,
        user: true,
        images: true,
      },
    });

    return this.mapToFullModel(tournament);
  }

  // Helper functions

  async ensureTournamentExists(id: string): Promise<TournamentModel> {
    const tournament = await this.getTournamentById(id);
    if (!tournament) {
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

  computeStatus = (tournament: TornamentPayload): TournamentStatus => {
    const now = new Date();
    if (now < tournament.dateStart) return TournamentStatus.UPCOMING;
    if (now >= tournament.dateStart && now < tournament.dateEnd)
      return TournamentStatus.ONGOING;
    return TournamentStatus.FINISHED;
  };

  // Mapping from Pyload to model

  mapToBaseModel = (tournament: TornamentPayload): TournamentBaseModel => {
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
      participants: tournament.participants.map(
        (participant) => participant.id,
      ),
      sportType: tournament.sportType,
      isActive: tournament.isActive,
      geoCoordinates: {
        latitude: tournament.latitude,
        longitude: tournament.longitude,
      },
      status: this.computeStatus(tournament),
    };
  };

  mapToFullModel = (tournament: TornamentPayload): TournamentModel => {
    const { latitude, longitude, minAge, maxAge, user, participants, ...rest } =
      tournament;

    return {
      ...rest,
      geoCoordinates: {
        latitude: latitude,
        longitude: longitude,
      },
      ageRestrictions: { minAge: minAge, maxAge: maxAge },
      organizer: {
        ...user,
      },
      status: this.computeStatus(tournament),
      participants: participants.map((participant) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { phoneNumber, ...rest } = participant;
        return {
          ...rest,
        };
      }),
    };
  };
}
