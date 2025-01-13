import {
  Body,
  Controller,
  Get,
  Post,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { FilesService } from 'src/files/files.service';
import { TournamentCreateDto } from './tournaments.dto';

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

  @Post()
  async createTournament(@Body() dto: TournamentCreateDto) {
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

    return await this.tournamentsService.createTournament({
      ...dto,
      images,
    });
  }
}
