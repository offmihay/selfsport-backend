import {
  IsUUID,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  ValidateNested,
  IsObject,
  IsArray,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TournamentFormat,
  TournamentSkillLevel,
  TournamentSport,
} from '@prisma/client';

class AgeRestrictionsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAge?: number;
}

class GeoCoordinatesDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

class ImageDto {
  @IsString()
  publicId: string;
}

export class TournamentDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsEnum(TournamentSport)
  sportType: TournamentSport;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsDateString()
  dateStart: string;

  @IsDateString()
  dateEnd: string;

  @IsNumber()
  @Min(0)
  entryFee: number;

  @IsNumber()
  @Min(0)
  prizePool: number;

  @ValidateNested()
  @Type(() => AgeRestrictionsDto)
  @IsOptional()
  ageRestrictions?: AgeRestrictionsDto;

  @ValidateNested()
  @Type(() => GeoCoordinatesDto)
  @IsObject()
  geoCoordinates: GeoCoordinatesDto;

  @IsOptional()
  @IsEnum(TournamentSkillLevel)
  skillLevel?: TournamentSkillLevel;

  @IsOptional()
  @IsEnum(TournamentFormat)
  format?: TournamentFormat;

  @IsNumber()
  @Min(1)
  maxParticipants: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  rules?: string | null;

  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  @IsArray()
  images: ImageDto[];
}
