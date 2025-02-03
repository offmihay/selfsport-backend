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
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { FilesService } from 'src/files/files.service';
import { TournamentCreateDto } from './tournaments.dto';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly filesService: FilesService,
  ) {}

  @Get()
  async getTournaments() {
    return await this.tournamentsService.getTournaments();
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
    const images = await this.filesService.transformImages(dto.images);

    const response = await this.tournamentsService.updateTournament(id, {
      ...dto,
      images,
    });
    if (!response) {
      throw new NotFoundException(`Tournament with id ${id} not found`);
    }
    return response;
  }

  @Post()
  async createTournament(
    @Body() dto: TournamentCreateDto,
    // @CurrentUserId() userId: string,
  ) {
    const images = await this.filesService.transformImages(dto.images);

    return await this.tournamentsService.createTournament({
      ...dto,
      images,
    });
  }
}
