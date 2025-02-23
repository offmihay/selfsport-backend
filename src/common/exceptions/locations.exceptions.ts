import { NotFoundException } from '@nestjs/common';

export class LocationNotFoundException extends NotFoundException {
  constructor() {
    super({
      statusCode: 404,
      error: 'Not Found',
      message: `Location not found`,
      code: 'location_not_found',
    });
  }
}
