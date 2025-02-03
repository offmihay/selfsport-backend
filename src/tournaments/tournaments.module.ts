import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { FilesModule } from 'src/files/files.module';
import { ClerkClientProvider } from 'src/providers/clerk-client.provider';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [FilesModule, UsersModule],
  controllers: [TournamentsController],
  providers: [TournamentsService, ClerkClientProvider],
})
export class TournamentsModule {}
