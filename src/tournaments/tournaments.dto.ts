import { Prisma } from '@prisma/client';

export type TournamentCreateDto = Omit<
  Prisma.TournamentCreateInput,
  'images'
> & {
  ageRestrictions?: { minAge?: number; maxAge?: number };
  geoCoordinates: { latitude: number; longitude: number };
  images?: { publicId: string }[];
};
