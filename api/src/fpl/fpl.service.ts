import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RawFplEntry } from './types/fpl-raw-types';
import { FplTeamOverviewDto } from './dto/fpl-team-overview.dto';
import { mapEntryToOverview } from './utils/fpl-mappers.util';

@Injectable()
export class FplService {
  constructor(private readonly usersService: UsersService) {}

  private async fetchRawEntryForUser(
    userId: number,
  ): Promise<{ teamId: string; raw: RawFplEntry }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.fplTeamId) {
      throw new BadRequestException('User has no FPL team ID set');
    }

    const teamId = user.fplTeamId;
    const url = `https://fantasy.premierleague.com/api/entry/${teamId}/`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      throw new InternalServerErrorException('Failed to call FPL API');
    }

    if (!response.ok) {
      throw new BadRequestException(
        `FPL API responded with status ${response.status}`,
      );
    }

    const data = (await response.json()) as RawFplEntry;

    return { teamId, raw: data };
  }

  /**
   * Raw debug/dev endpoint – returns FPL response shape.
   */
  async syncTeamForUser(userId: number) {
    return this.fetchRawEntryForUser(userId);
  }

  /**
   * Clean app-level "team overview" DTO for the frontend.
   */
  async getTeamOverviewForUser(userId: number): Promise<FplTeamOverviewDto> {
    const { teamId, raw } = await this.fetchRawEntryForUser(userId);
    return mapEntryToOverview(teamId, raw);
  }
}
