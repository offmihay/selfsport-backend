import {
  Body,
  Controller,
  Get,
  Delete,
  Put,
  Post,
  NotFoundException,
  Param,
  ForbiddenException,
  ConflictException,
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

  @Post(':id/register')
  async register(@CurrentUserId() userId: string, @Param('id') id: string) {
    const user = await this.usersService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      await this.usersService.createUser({ id: userId });
    }

    const isUserParticipating =
      await this.tournamentsService.isUserParticipating(id, userId);

    if (isUserParticipating) {
      throw new ConflictException(
        'You are already registered for this tournament',
      );
    }

    const tournamentById = await this.getTournamentById(id);

    if (tournamentById?.participants[tournamentById.maxParticipants! - 1]) {
      throw new ConflictException(
        'Max participants reached for this tournament',
      );
    }

    return await this.tournamentsService.register(id, userId);
  }

  @Delete(':id/leave')
  async leave(@CurrentUserId() userId: string, @Param('id') id: string) {
    const user = await this.usersService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      await this.usersService.createUser({ id: userId });
    }

    const isUserParticipating =
      await this.tournamentsService.isUserParticipating(id, userId);

    if (!isUserParticipating) {
      throw new ConflictException('You are not registered for this tournament');
    }

    return await this.tournamentsService.leave(id, userId);
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
    const tournament = await this.tournamentsService.getTournamentById(id);
    if (!tournament) {
      throw new NotFoundException(`Tournament with id ${id} not found`);
    }
    return tournament;
  }

  @Delete(':id')
  async DeleteTournament(@Param('id') id: string) {
    const response = await this.tournamentsService.deleteTournament(id);
    if (!response) {
      throw new NotFoundException(`Tournament with id ${id} not found`);
    }
    return response;
  }

  @Put(':id')
  async UpdateTournament(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: TournamentCreateDto,
  ) {
    const tournament = await this.tournamentsService.getTournamentById(id);
    if (tournament?.createdBy !== userId) {
      throw new ForbiddenException();
    }

    const user = await this.usersService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      await this.usersService.createUser({ id: userId });
    }

    const images = await this.filesService.transformImages(dto.images);

    const response = await this.tournamentsService.updateTournament(id, {
      ...dto,
      images,
      user: {
        connect: { id: userId },
      },
    });
    if (!response) {
      throw new NotFoundException(`Tournament with id ${id} not found`);
    }
    return response;
  }

  @Post()
  async createTournament(
    @Body() dto: TournamentCreateDto,
    @CurrentUserId() userId: string,
  ) {
    const images = await this.filesService.transformImages(dto.images);
    const user = await this.usersService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      await this.usersService.createUser({ id: userId });
    }

    return await this.tournamentsService.createTournament({
      ...dto,
      images,
      user: {
        connect: { id: userId },
      },
    });
  }
}
