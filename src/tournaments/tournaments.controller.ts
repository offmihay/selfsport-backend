import {
  Body,
  Controller,
  Get,
  Delete,
  Put,
  Post,
  Param,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';
import { TournamentDto } from './tournaments.dto';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  async getTournaments() {
    return await this.tournamentsService.getTournaments();
  }

  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Post()
  async createTournament(
    @Body() dto: TournamentDto,
    @CurrentUserId() userId: string,
  ) {
    return await this.tournamentsService.createTournament(userId, dto);
  }

  @Get('created')
  async getCreatedTournaments(@CurrentUserId() userId: string) {
    return await this.tournamentsService.getCreatedTournaments(userId);
  }

  @Get('participated')
  async getParticipatedTournaments(@CurrentUserId() userId: string) {
    return await this.tournamentsService.getParticipatedTournaments(userId);
  }

  @Get(':id')
  async getTournamentById(@Param('id') id: string) {
    return await this.tournamentsService.getTournamentById(id);
  }

  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Put(':id')
  async UpdateTournament(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() dto: TournamentDto,
  ) {
    return await this.tournamentsService.updateTournament(id, userId, dto);
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
