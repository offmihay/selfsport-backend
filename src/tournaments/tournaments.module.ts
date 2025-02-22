import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { FilesModule } from 'src/files/files.module';
import { ClerkClientProvider } from 'src/providers/clerk-client.provider';
import { UsersModule } from 'src/users/users.module';
import { LocationModule } from 'src/locations/location.module';

@Module({
  imports: [FilesModule, UsersModule, LocationModule],
  controllers: [TournamentsController],
  providers: [TournamentsService, ClerkClientProvider],
})
export class TournamentsModule {}
