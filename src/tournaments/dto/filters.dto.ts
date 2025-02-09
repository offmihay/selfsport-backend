import {
  IsOptional,
  IsEnum,
  IsNumber,
  ValidateNested,
  IsString,
  IsArray,
  IsDate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TournamentSkillLevel, TournamentSport } from '@prisma/client';

export class RangeDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  max?: number;
}

export class FilterTournamentsDto {
  @IsOptional()
  @IsEnum(TournamentSport, { each: true })
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  sportType?: TournamentSport[];

  @IsOptional()
  @IsEnum(TournamentSkillLevel, { each: true })
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  skillLevel?: TournamentSkillLevel[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeDto)
  prizePool?: RangeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeDto)
  entryFee?: RangeDto;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  date?: Date;
}
