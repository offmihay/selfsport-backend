import { IsOptional, IsString, IsIn } from 'class-validator';

export class SortTournamentsDto {
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  @IsIn(['dateStart', 'prizePool', 'dateCreated'])
  sortBy?: 'dateStart' | 'prizePool' | 'dateCreated';
}
