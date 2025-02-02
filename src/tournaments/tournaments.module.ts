import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { FilesModule } from 'src/files/files.module';
import { ClerkClientProvider } from 'src/providers/clerk-client.provider';

@Module({
  imports: [FilesModule],
  controllers: [TournamentsController],
  providers: [TournamentsService, ClerkClientProvider],
})
export class TournamentsModule {}
