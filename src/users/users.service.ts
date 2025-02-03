import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

type UsersCreateModel = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  orginizerName?: string;
  organizerContact?: string;
  isVerified?: boolean;
};

@Injectable()
export class UsersService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async createUser(data: UsersCreateModel) {
    await this.user.create({
      data: {
        ...data,
        email: data.email || `test${new Date().getTime()}@test.com`,
      },
    });
    return data;
  }
}
