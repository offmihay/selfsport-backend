import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class TournamentsService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async getTournaments() {
    const tournaments = await this.tournament.findMany({
      include: {
        images: true,
      },
    });

    const extendedTournaments = tournaments.map((tournament) => {
      return {
        ...tournament,
        geoCoordinates: {
          latitude: tournament.latitude,
          longitude: tournament.longitude,
        },
        ageRestrictions: {
          minAge: tournament.minAge,
          maxAge: tournament.maxAge,
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
    });

    return extendedTournaments;
  }
}
