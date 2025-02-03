import { ClerkClient } from '@clerk/backend';
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

type TournamentWithImages = Prisma.TournamentGetPayload<{
  include: { images: true };
}>;

type TournamentModel = ReturnType<typeof addTournamentExtraProps>;

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

  async getTournaments(): Promise<TournamentModel[]> {
    const tournaments = await this.tournament.findMany({
      include: {
        images: true,
      },
    });

    return tournaments.map(addTournamentExtraProps);
  }

  async getTournamentById(id: string): Promise<TournamentModel | null> {
    const tournament = await this.tournament.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    return tournament ? addTournamentExtraProps(tournament) : null;
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
}

const addTournamentExtraProps = (tournament: TournamentWithImages) => {
  const { latitude, longitude, minAge, maxAge, ...rest } = tournament;

  return {
    ...rest,
    geoCoordinates: {
      latitude,
      longitude,
    },
    ageRestrictions: {
      minAge,
      maxAge,
    },
    currentParticipants: {
      count: 12,
      participants: [
        {
          id: 'uuid1',
          name: 'John Doe',
        },
        {
          id: 'uuid2',
          name: 'Jane Smith',
        },
      ],
    },
    organizer: {
      id: 'organizerId',
      name: 'Club XYZ',
      contact: {
        email: 'contact@clubxyz.com',
        phone: '+1234567890',
      },
      verified: true,
    },
  };
};
