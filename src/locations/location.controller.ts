import { Controller, Get, Headers, Req } from '@nestjs/common';
import { LocationService } from './location.service';
import { Request } from 'express';
import { LocationNotFoundException } from 'src/common/exceptions/locations.exceptions';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  async getLocation(
    @Headers('X-Forwarded-For') xForwardedFor: string,
    @Req() req: Request,
  ) {
    // const ip = xForwardedFor || req.ip;
    const ip = '109.197.218.217';
    const response = await this.locationService.getCoordsAPI(ip);
    if (!response) {
      throw new LocationNotFoundException();
    }
    return response;
  }
}
