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
      code: 'TOURNAMENT_NOT_FOUND',
    });
  }
}

export class AlreadyRegisteredException extends ConflictException {
  constructor() {
    super({
      statusCode: 409,
      error: 'Conflict',
      message: 'User is already registered for this tournament',
      code: 'TOURNAMENT_ALREADY_REGISTERED',
    });
  }
}

export class NotRegisteredException extends ConflictException {
  constructor() {
    super({
      statusCode: 409,
      error: 'Conflict',
      message: 'User is not registered for this tournament',
      code: 'TOURNAMENT_NOT_REGISTERED',
    });
  }
}

export class MaxParticipantsReachedException extends ConflictException {
  constructor() {
    super({
      statusCode: 409,
      error: 'Conflict',
      message: 'Maximum number of participants reached',
      code: 'MAX_PARTICIPANTS_REACHED',
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
