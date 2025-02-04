import { ClerkClient } from '@clerk/backend';
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

type TornamentPayload = Prisma.TournamentGetPayload<{
  include: { images: true; participants: true; user: true };
}>;

type TournamentModel = Omit<
  TornamentPayload,
  'latitude' | 'longitude' | 'minAge' | 'maxAge' | 'user'
> & {
  geoCoordinates: {
    latitude: number;
    longitude: number;
  };
  ageRestrictions?: { minAge: number | null; maxAge: number | null };
  organizer: TornamentPayload['user'];
  participants: TornamentPayload['user'][];
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
  | 'status'
> & {
  participants: string[];
};

type TournamentCreateModel = Omit<
  Prisma.TournamentCreateInput,
  'latitude' | 'longitude' | 'minAge' | 'maxAge' | 'images'
> & {
  ageRestrictions?: { minAge?: number; maxAge?: number };
  geoCoordinates: { latitude: number; longitude: number };
  images?: {
    createdAt: string;
    publicId: string;
    url: string;
    secureUrl: string;
  }[];
};

@Injectable()
export class TournamentsService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Inject('ClerkClient')
    private readonly clerkClient: ClerkClient,
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

  async getTournaments(): Promise<TournamentBaseModel[]> {
    const tournaments = await this.tournament.findMany({
      include: {
        images: true,
        participants: true,
      },
    });

    return tournaments.map(mapToBaseModel);
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

    return tournaments.map(mapToBaseModel);
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
        participants: { some: { id: userId } },
      },
    });

    return tournaments.map(mapToBaseModel);
  }

  async getTournamentById(id: string): Promise<TournamentModel | null> {
    const tournament = await this.tournament.findUnique({
      where: { id },
      include: {
        images: true,
        user: true,
        participants: true,
      },
    });

    return tournament ? mapToFullModel(tournament) : null;
  }

  async deleteTournament(id: string): Promise<{ message: string } | null> {
    const tournament = await this.tournament.findUnique({
      where: { id },
    });

    if (tournament) {
      await this.image.deleteMany({
        where: { tournamentId: id },
      });

      await this.tournament.delete({
        where: { id },
      });
      return { message: 'Tournament was deleted succesfully' };
    }
    return null;
  }

  async updateTournament(
    id: string,
    data: TournamentCreateModel,
  ): Promise<TournamentModel | null> {
    const { geoCoordinates, ageRestrictions, images, ...rest } = data;

    const tournament = await this.tournament.findUnique({
      where: { id },
    });

    if (tournament) {
      await this.image.deleteMany({
        where: { tournamentId: id },
      });

      await this.tournament.update({
        where: { id },
        data: {
          ...rest,
          latitude: geoCoordinates.latitude,
          longitude: geoCoordinates.longitude,
          minAge: ageRestrictions?.minAge,
          maxAge: ageRestrictions?.maxAge,
          images: {
            create: images,
          },
        },
      });
      return await this.getTournamentById(tournament.id);
    }
    return null;
  }

  async createTournament(data: TournamentCreateModel) {
    const { geoCoordinates, ageRestrictions, images, ...rest } = data;

    const tournament = await this.tournament.create({
      data: {
        ...rest,
        latitude: geoCoordinates.latitude,
        longitude: geoCoordinates.longitude,
        minAge: ageRestrictions?.minAge,
        maxAge: ageRestrictions?.maxAge,
        images: {
          create: images,
        },
      },
    });

    return await this.getTournamentById(tournament.id);
  }

  async isUserParticipating(id: string, userId: string): Promise<boolean> {
    const usersCount = await this.tournament.count({
      where: {
        id,
        participants: {
          some: {
            id: userId,
          },
        },
      },
    });
    return !!usersCount;
  }

  async register(
    id: string,
    userId: string,
  ): Promise<TournamentBaseModel | null> {
    const tournament = await this.tournament.update({
      where: { id },
      data: { participants: { connect: { id: userId } } },
      include: {
        participants: true,
        user: true,
        images: true,
      },
    });

    return tournament ? mapToBaseModel(tournament) : null;
  }

  async leave(id: string, userId: string): Promise<TournamentBaseModel | null> {
    const tournament = await this.tournament.update({
      where: { id },
      data: { participants: { disconnect: { id: userId } } },
      include: {
        participants: true,
        user: true,
        images: true,
      },
    });

    return tournament ? mapToBaseModel(tournament) : null;
  }
}

const mapToBaseModel = (tournament: TornamentPayload): TournamentBaseModel => {
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
    participants: tournament.participants.map((participant) => participant.id),
    sportType: tournament.sportType,
    status: tournament.status,
  };
};

const mapToFullModel = (tournament: TornamentPayload): TournamentModel => {
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
    participants: { ...participants },
  };
};
