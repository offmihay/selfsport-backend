import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export class TournamentNotFoundException extends NotFoundException {
  constructor() {
    super({
      statusCode: 404,
      error: 'Not Found',
      message: `Tournament not found`,
      code: 'tournament_not_found',
    });
  }
}

export class AlreadyRegisteredException extends ConflictException {
  constructor() {
    super({
      statusCode: 409,
      error: 'Conflict',
      message: 'User is already registered for this tournament',
      code: 'tournament_already_registered',
    });
  }
}

export class NotRegisteredException extends ConflictException {
  constructor() {
    super({
      statusCode: 409,
      error: 'Conflict',
      message: 'User is not registered for this tournament',
      code: 'tournament_not_registered',
    });
  }
}

export class MaxParticipantsReachedException extends ConflictException {
  constructor() {
    super({
      statusCode: 409,
      error: 'Conflict',
      message: 'Maximum number of participants reached',
      code: 'max_participants_reached',
    });
  }
}

export class ForbiddenTournamentAccessException extends ForbiddenException {
  constructor() {
    super({
      statusCode: 403,
      error: 'Forbidden',
      message: 'You do not have permission to access this tournament',
      code: 'TOURNAMENT_FORBIDDEN',
    });
  }
}
