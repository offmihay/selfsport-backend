import {
  Body,
  Controller,
  Get,
  Delete,
  Put,
  Post,
  Param,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { FilesService } from 'src/files/files.service';
import { TournamentCreateDto } from './tournaments.dto';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';
import { UsersService } from 'src/users/users.service';
import { Public } from 'src/decorators/public.decorator';

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
  ) {}
  @Public()
  @Get()
  async getTournaments() {
    return await this.tournamentsService.getTournaments();
  }

  @Post()
  async createTournament(
    @Body() dto: TournamentCreateDto,
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

  @Put(':id')
  async UpdateTournament(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() dto: TournamentCreateDto,
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
