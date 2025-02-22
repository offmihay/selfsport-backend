import {
  Body,
  Controller,
  Get,
  Delete,
  Put,
  Headers,
  Post,
  Param,
  Query,
  Patch,
  ParseBoolPipe,
  DefaultValuePipe,
  Req,
} from '@nestjs/common';
import { QueryTournamentsDto, TournamentsService } from './tournaments.service';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';
import { TournamentDto } from './dto/tournaments.dto';
import { Public } from 'src/decorators/public.decorator';
import { LocationService } from 'src/locations/location.service';
import { Request } from 'express';

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly locationService: LocationService,
  ) {}

  @Get()
  @Public()
  async getTournaments(
    @Query() query: QueryTournamentsDto,
    @CurrentUserId() userId: string,
    @Headers('X-Forwarded-For') xForwardedFor: string,
    @Req() req: Request,
  ) {
    const ip = xForwardedFor || req.ip;
    if ((!query.lat || !query.lng) && ip) {
      const location = await this.locationService.getLocationByIp(ip);
      if (location) {
        query.lat = location.lat;
        query.lng = location.lng;
      }
    }
    if (!query.radius) {
      query.radius = 50;
    }
    return await this.tournamentsService.getTournaments(query, userId);
  }

  @Public()
  @Post()
  async createTournament(
    @Body() dto: TournamentDto,
    // @CurrentUserId() userId: string,
  ) {
    const userId = 'user_2sdUIRdYMm8UXPurFfn5w6kzDSX';
    return await this.tournamentsService.createTournament(dto, userId);
  }

  @Get('my')
  async getMyTournaments(
    @CurrentUserId() userId: string,
    @Query('finished', new DefaultValuePipe(false), ParseBoolPipe)
    isFinished: boolean,
  ) {
    return await this.tournamentsService.getMyTournaments(userId, isFinished);
  }

  @Get(':id')
  async getTournamentById(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return await this.tournamentsService.getTournamentById(id, userId);
  }

  @Put(':id')
  async UpdateTournament(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() dto: TournamentDto,
  ) {
    return await this.tournamentsService.updateTournament(id, userId, dto);
  }

  @Patch(':id/user')
  async RemoveUser(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Query('participantId') participantId: string,
  ) {
    return await this.tournamentsService.removeUser(id, userId, participantId);
  }

  @Patch(':id/status')
  async UpdateStatus(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Query('isActive', ParseBoolPipe) isActive: boolean,
  ) {
    return await this.tournamentsService.updateStatus(id, userId, isActive);
  }

  @Delete(':id')
  async DeleteTournament(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return await this.tournamentsService.deleteTournament(id, userId);
  }

  @Post(':id/register')
  async register(@CurrentUserId() userId: string, @Param('id') id: string) {
    return await this.tournamentsService.register(id, userId);
  }

  @Delete(':id/leave')
  async leave(@CurrentUserId() userId: string, @Param('id') id: string) {
    return await this.tournamentsService.leave(id, userId);
  }
}
