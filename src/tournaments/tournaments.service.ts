import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Tournament } from '@prisma/client';

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

  async getTournaments(): Promise<Tournament[]> {
    return this.tournament.findMany();
  }
}
