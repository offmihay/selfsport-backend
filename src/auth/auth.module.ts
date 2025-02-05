import { Module } from '@nestjs/common';
import { ClerkStrategy } from './clerk.strategy';
import { PassportModule } from '@nestjs/passport';
import { ClerkClientProvider } from 'src/providers/clerk-client.provider';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule, PassportModule, ConfigModule],
  providers: [
    ClerkStrategy,
    ClerkClientProvider,
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
  exports: [PassportModule, ClerkClientProvider],
})
export class AuthModule {}
