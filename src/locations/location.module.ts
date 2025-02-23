import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { HttpModule } from '@nestjs/axios';
import { LocationController } from './location.controller';

@Module({
  imports: [HttpModule],
  providers: [LocationService],
  exports: [LocationService],
  controllers: [LocationController],
})
export class LocationModule {}
