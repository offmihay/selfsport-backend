import { UserJSON } from '@clerk/backend/dist/api/resources/JSON';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export type UsersCreateModel = {
  id: string;
  email?: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl?: string;
  organizerName?: string;
  organizerContact?: string;
  organizerEmail?: string;
  isVerified: boolean;
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

  async createUser(data: UserJSON) {
    await this.user.create({
      data: {
        id: data.id,
        email: data.email_addresses[0].email_address,
        ...this.transformData(data),
      },
    });
    return data;
  }

  async updateUser(data: UserJSON) {
    await this.user.update({
      where: { id: data.id },
      data: {
        email: data.email_addresses[0].email_address,
        ...this.transformData(data),
      },
    });
    return data;
  }

  transformData(data: UserJSON) {
    return {
      firstName: data.first_name,
      lastName: data.last_name,
      imageUrl: data.image_url,
      phoneNumber:
        typeof data.unsafe_metadata.phoneNumber === 'string'
          ? data.unsafe_metadata.phoneNumber
          : undefined,
      organizerDetails:
        typeof data.unsafe_metadata.organizerDetails === 'string'
          ? data.unsafe_metadata.organizerDetails
          : undefined,
      organizerName:
        typeof data.unsafe_metadata.organizerName === 'string'
          ? data.unsafe_metadata.organizerName
          : undefined,
      organizerEmail:
        typeof data.unsafe_metadata.organizerEmail === 'string'
          ? data.unsafe_metadata.organizerEmail
          : undefined,
      organizerPhone:
        typeof data.unsafe_metadata.organizerPhone === 'string'
          ? data.unsafe_metadata.organizerPhone
          : undefined,
      isVerified:
        typeof data.public_metadata.isVerified === 'boolean'
          ? data.public_metadata.isVerified
          : false,
    };
  }
}
