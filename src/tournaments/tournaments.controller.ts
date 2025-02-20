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
} from '@nestjs/common';
import { QueryTournamentsDto, TournamentsService } from './tournaments.service';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';
import { TournamentDto } from './dto/tournaments.dto';
import { Public } from 'src/decorators/public.decorator';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  @Public()
  async getTournaments(
    @Query() query: QueryTournamentsDto,
    @CurrentUserId() userId: string,
    @Headers('X-Forwarded-For') xForwardedFor: string,
  ) {
    console.log(`X-Forwarded-For: ${xForwardedFor}`);
    return await this.tournamentsService.getTournaments(query, userId);
  }

  @Post()
  async createTournament(
    @Body() dto: TournamentDto,
    @CurrentUserId() userId: string,
  ) {
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
