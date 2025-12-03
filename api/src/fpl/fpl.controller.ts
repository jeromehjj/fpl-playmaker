import type { AuthRequest } from './../auth/types/auth-request.type';
import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FplService } from './fpl.service';
import type { FplPosition } from './types/fpl-position';
import { PlayerSortKey } from './types/fpl-list-player-options.type';

@Controller('fpl')
@UseGuards(JwtAuthGuard)
export class FplController {
  constructor(private readonly fplService: FplService) {}

  @Post('sync-team')
  async syncTeam(@Req() req: AuthRequest) {
    return this.fplService.syncTeamForUser(req.user.userId);
  }

  @Post('sync-bootstrap')
  async syncBootstrap() {
    return this.fplService.syncBootstrapData();
  }

  @Get('players')
  async listPlayers(
    @Query('clubId') clubId?: string,
    @Query('position') position?: FplPosition,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('minMinutes') minMinutes?: string,
    @Query('sortKey') sortKey?: string,
    @Query('sortDirection') sortDirection?: string,
  ) {
    const parsedClubId = clubId ? Number(clubId) : undefined;
    const parsedLimit = limit ? Number(limit) : undefined;
    const parsedOffset = offset ? Number(offset) : undefined;
    const parsedMinMinutes = minMinutes ? Number(minMinutes) : undefined;

    const validPositions: FplPosition[] = ['GK', 'DEF', 'MID', 'FWD'];
    const normalizedPosition = validPositions.includes(position as FplPosition)
      ? (position as FplPosition)
      : undefined;

    const normalizedSortKey = sortKey as any as PlayerSortKey | undefined;
    const normalizedSortDirection =
      sortDirection === 'ASC' || sortDirection === 'DESC'
        ? sortDirection
        : undefined;

    return this.fplService.listPlayers({
      clubExternalId:
        parsedClubId && !Number.isNaN(parsedClubId) ? parsedClubId : undefined,
      position: normalizedPosition,
      search,
      limit:
        parsedLimit && !Number.isNaN(parsedLimit) ? parsedLimit : undefined,
      offset:
        parsedOffset && !Number.isNaN(parsedOffset) ? parsedOffset : undefined,
      minMinutes:
        parsedMinMinutes && !Number.isNaN(parsedMinMinutes)
          ? parsedMinMinutes
          : undefined,
      sortKey: normalizedSortKey,
      sortDirection: normalizedSortDirection,
    });
  }

  @Get('squad')
  async getSquad(@Req() req: AuthRequest) {
    return this.fplService.getCurrentSquadForUser(req.user.userId);
  }

  @Get('team')
  async getTeam(@Req() req: AuthRequest) {
    return this.fplService.getTeamOverviewForUser(req.user.userId);
  }
}
