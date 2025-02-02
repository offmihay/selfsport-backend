import {
  Body,
  Controller,
  Get,
  Delete,
  Put,
  Post,
  NotFoundException,
  Param,
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
    @Param('id') id: string,
    @Body() dto: TournamentCreateDto,
  ) {
    const publicIds = dto.images?.map((image) => image.publicId);

    const resources = publicIds?.length
      ? (await this.filesService.getResourcesByPublicIds(publicIds)).resources
      : [];

    const images = resources.map((r) => ({
      createdAt: r.created_at,
      publicId: r.public_id,
      url: r.url,
      secureUrl: r.secure_url,
    }));

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
    @CurrentUserId() currentUserId: string,
  ) {
    const publicIds = dto.images?.map((image) => image.publicId);

    const resources = publicIds?.length
      ? (await this.filesService.getResourcesByPublicIds(publicIds)).resources
      : [];

    const images = resources.map((r) => ({
      createdAt: r.created_at,
      publicId: r.public_id,
      url: r.url,
      secureUrl: r.secure_url,
    }));

    console.log('Current user:', currentUserId);

    return await this.tournamentsService.createTournament({
      ...dto,
      images,
    });
  }
}
