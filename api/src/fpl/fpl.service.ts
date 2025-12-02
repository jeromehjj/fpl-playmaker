import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RawFplEntry } from './types/fpl-raw-types';
import { FplTeamOverviewDto } from './dto/fpl-team-overview.dto';
import {
  mapElementTypeToPosition,
  mapEntryToOverview,
} from './utils/fpl-mappers.util';
import { FplTeam } from './entities/fpl-team.entity';
import { FplLeague } from './entities/fpl-league.entity';
import { User } from '../users/user.entity';
import { FplClub } from './entities/fpl-club.entity';
import { FplPlayer } from './entities/fpl-player.entity';
import {
  RawBootstrapStatic,
  RawBootstrapPlayer,
} from './types/fpl-bootstrap-static.type';
import { FplPlayerListItemDto } from './dto/fpl-player.dto';
import { ListPlayersOptions } from './types/fpl-list-player-options.type';
import { RawFplPicksResponse } from './types/fpl-picks.type';
import { FplSquadDto } from './dto/fpl-squad.dto';

@Injectable()
export class FplService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(FplTeam)
    private readonly teamRepository: Repository<FplTeam>,
    @InjectRepository(FplLeague)
    private readonly leagueRepository: Repository<FplLeague>,
    @InjectRepository(FplClub)
    private readonly clubRepository: Repository<FplClub>,
    @InjectRepository(FplPlayer)
    private readonly playerRepository: Repository<FplPlayer>,
  ) {}

  /**
   * Helper: load user and ensure they have an FPL team id.
   */
  private async getUserAndTeamIdOrThrow(
    userId: number,
  ): Promise<{ user: User; teamId: string }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.fplTeamId) {
      // NO FPL TEAM ID
      throw new BadRequestException({
        statusCode: 400,
        code: 'NO_FPL_TEAM',
        message: 'User has no FPL team ID set',
      });
    }
    return { user, teamId: user.fplTeamId };
  }

  /**
   * Calls the FPL API and returns raw entry JSON for the user's team.
   * This ALWAYS goes to FPL (no caching).
   */
  private async fetchRawEntryForUser(
    userId: number,
  ): Promise<{ teamId: string; raw: RawFplEntry }> {
    const { teamId } = await this.getUserAndTeamIdOrThrow(userId);
    const url = `https://fantasy.premierleague.com/api/entry/${teamId}/`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      throw new InternalServerErrorException('Failed to call FPL API');
    }

    if (!response.ok) {
      throw new BadGatewayException({
        statusCode: 502,
        code: 'FPL_UPSTREAM_ERROR',
        message: `FPL API responded with status ${response.status}`,
      });
    }

    const data = (await response.json()) as RawFplEntry;

    return { teamId, raw: data };
  }

  /**
   * Fetches bootstrap-static payload (clubs + players).
   */
  private async fetchBootstrapStatic(): Promise<RawBootstrapStatic> {
    const url = 'https://fantasy.premierleague.com/api/bootstrap-static/';

    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      throw new InternalServerErrorException('Failed to call FPL API');
    }

    if (!response.ok) {
      throw new BadGatewayException({
        statusCode: 502,
        code: 'FPL_UPSTREAM_ERROR',
        message: `FPL API responded with status ${response.status}`,
      });
    }

    return (await response.json()) as RawBootstrapStatic;
  }

  /**
   * Fetch current-event picks for the user's team from FPL.
   */
  private async fetchPicksForUser(userId: number): Promise<{
    teamId: string;
    currentEvent: number;
    raw: RawFplPicksResponse;
  }> {
    const { teamId } = await this.getUserAndTeamIdOrThrow(userId);

    // Use cached entry to know the current event
    const { raw: entryRaw } = await this.getOrSyncRawEntryForUser(userId);
    const currentEvent = entryRaw.current_event;

    if (!currentEvent) {
      throw new BadRequestException(
        'Current event is not available for this team',
      );
    }

    const url = `https://fantasy.premierleague.com/api/entry/${teamId}/event/${currentEvent}/picks/`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      throw new InternalServerErrorException('Failed to call FPL API');
    }

    if (!response.ok) {
      throw new BadGatewayException({
        statusCode: 502,
        code: 'FPL_UPSTREAM_ERROR',
        message: `FPL picks API responded with status ${response.status}`,
      });
    }

    const data = (await response.json()) as RawFplPicksResponse;

    return { teamId, currentEvent, raw: data };
  }

  /**
   * Sync clubs and players from bootstrap-static into the DB.
   */
  async syncBootstrapData() {
    const bootstrap = await this.fetchBootstrapStatic();

    // Upsert clubs (FPL calls them "teams" in bootstrap-static)
    const clubsToUpsert = bootstrap.teams.map((team) => ({
      externalId: team.id,
      name: team.name,
      shortName: team.short_name,
    }));

    await this.clubRepository.upsert(clubsToUpsert, ['externalId']);

    const clubs = await this.clubRepository.find({
      where: { externalId: In(bootstrap.teams.map((t) => t.id)) },
    });
    const clubByExternalId = new Map<number, FplClub>(
      clubs.map((club) => [club.externalId, club]),
    );

    // Upsert players
    const playersToUpsert = bootstrap.elements.map((player) => {
      const club = clubByExternalId.get(player.team);
      if (!club) {
        throw new InternalServerErrorException(
          `Missing club for team id ${player.team} while syncing players`,
        );
      }

      const fullName = `${player.first_name ?? ''} ${player.second_name ?? ''}`
        .trim()
        .replace(/\s+/g, ' ');

      return {
        externalId: player.id,
        club: { id: club.id },
        webName: player.web_name,
        fullName: fullName.length > 0 ? fullName : null,
        position: mapElementTypeToPosition(player.element_type),
        nowCost: player.now_cost,
        raw: player,
      };
    });

    await this.playerRepository.upsert(playersToUpsert, ['externalId']);

    return {
      clubsSynced: clubsToUpsert.length,
      playersSynced: playersToUpsert.length,
    };
  }

  /**
   * Read-only list of players with optional filters.
   */
  async listPlayers(
    options: ListPlayersOptions = {},
  ): Promise<FplPlayerListItemDto[]> {
    const {
      clubExternalId,
      position,
      search,
      offset = 0,
      limit = 50,
    } = options;

    const qb = this.playerRepository
      .createQueryBuilder('player')
      .leftJoinAndSelect('player.club', 'club')
      .orderBy('player.nowCost', 'DESC')
      .addOrderBy('player.webName', 'ASC')
      .limit(Math.min(Math.max(limit, 1), 200)) // guard limits
      .offset(Math.max(offset, 0));

    if (clubExternalId) {
      qb.andWhere('club.externalId = :clubExternalId', { clubExternalId });
    }

    if (position) {
      qb.andWhere('player.position = :position', { position });
    }

    if (search) {
      qb.andWhere(
        '(player.webName ILIKE :search OR player.fullName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const players = await qb.getMany();

    return players.map((p) => {
      const raw = (p.raw ?? null) as RawBootstrapPlayer | null;

      const valueMillions = p.nowCost / 10;
      const totalPoints = raw?.total_points ?? null;
      const pointsPerGame = raw
        ? Number.parseFloat(raw.points_per_game) || null
        : null;
      const minutes = raw?.minutes ?? null;
      const pointsPerMillion =
        totalPoints !== null && valueMillions > 0
          ? Number((totalPoints / valueMillions).toFixed(2))
          : null;

      return {
        id: p.id,
        externalId: p.externalId,
        webName: p.webName,
        fullName: p.fullName,
        position: p.position,
        nowCost: p.nowCost,
        valueMillions,
        totalPoints,
        pointsPerGame,
        pointsPerMillion,
        minutes,
        club: {
          id: p.club.id,
          externalId: p.club.externalId,
          name: p.club.name,
          shortName: p.club.shortName,
        },
      };
    });
  }

  /**
   * Return current gameweek squad (XI + bench) mapped to stored players.
   */
  async getCurrentSquadForUser(userId: number): Promise<FplSquadDto> {
    const { teamId, currentEvent, raw } = await this.fetchPicksForUser(userId);

    const elementIds = raw.picks.map((p) => p.element);
    if (elementIds.length === 0) {
      return {
        event: currentEvent,
        teamId,
        value: raw.entry_history.value,
        bank: raw.entry_history.bank,
        starting: [],
        bench: [],
      };
    }

    const players = await this.playerRepository.find({
      where: { externalId: In(elementIds) },
      relations: ['club'],
    });

    const byExternalId = new Map(players.map((p) => [p.externalId, p]));

    const starting: FplSquadDto['starting'] = [];
    const bench: FplSquadDto['bench'] = [];

    for (const pick of raw.picks) {
      const player = byExternalId.get(pick.element);
      if (!player) {
        continue;
      }

      const isStarting = pick.position <= 11;
      const rawPlayer = (player.raw ?? null) as RawBootstrapPlayer | null;

      const valueMillions = player.nowCost / 10;
      const totalPoints = rawPlayer?.total_points ?? null;
      const pointsPerGame = rawPlayer
        ? Number.parseFloat(rawPlayer.points_per_game) || null
        : null;
      const minutes = rawPlayer?.minutes ?? null;
      const pointsPerMillion =
        totalPoints !== null && valueMillions > 0
          ? Number((totalPoints / valueMillions).toFixed(2))
          : null;

      const dto = {
        id: player.id,
        externalId: player.externalId,
        webName: player.webName,
        fullName: player.fullName,
        position: player.position,
        nowCost: player.nowCost,
        valueMillions,
        totalPoints,
        pointsPerGame,
        pointsPerMillion,
        minutes,
        club: {
          id: player.club.id,
          externalId: player.club.externalId,
          name: player.club.name,
          shortName: player.club.shortName,
        },
        pick: {
          position: pick.position,
          multiplier: pick.multiplier,
          isCaptain: pick.is_captain,
          isViceCaptain: pick.is_vice_captain,
          isStarting,
        },
      };

      if (isStarting) {
        starting.push(dto);
      } else {
        bench.push(dto);
      }
    }

    return {
      event: raw.entry_history.event,
      teamId,
      value: raw.entry_history.value,
      bank: raw.entry_history.bank,
      starting,
      bench,
    };
  }

  /**
   * Save or update the FPL snapshot for this user in the DB.
   * Uses the mapped overview plus the raw JSON.
   */
  private async saveSnapshotForUser(
    userId: number,
    teamId: string,
    raw: RawFplEntry,
  ): Promise<FplTeam> {
    const { user } = await this.getUserAndTeamIdOrThrow(userId);
    const overview = mapEntryToOverview(teamId, raw);

    // Upsert FplTeam
    let team = await this.teamRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!team) {
      team = this.teamRepository.create({
        user,
        entryId: overview.teamId,
        teamName: overview.teamName,
        managerName: overview.managerName,
        region: overview.region,
        regionCode: overview.regionCode,
        overallPoints: overview.overallPoints,
        overallRank: overview.overallRank,
        gwPoints: overview.gwPoints,
        gwRank: overview.gwRank,
        currentEvent: overview.currentEvent,
        lastSyncedAt: new Date(),
        raw,
      });
    } else {
      team.entryId = overview.teamId;
      team.teamName = overview.teamName;
      team.managerName = overview.managerName;
      team.region = overview.region;
      team.regionCode = overview.regionCode;
      team.overallPoints = overview.overallPoints;
      team.overallRank = overview.overallRank;
      team.gwPoints = overview.gwPoints;
      team.gwRank = overview.gwRank;
      team.currentEvent = overview.currentEvent;
      team.lastSyncedAt = new Date();
      team.raw = raw;
    }

    const savedTeam = await this.teamRepository.save(team);

    // Replace leagues for this team
    await this.leagueRepository.delete({ team: savedTeam });

    const leagueEntities = overview.leagues.map((lg) =>
      this.leagueRepository.create({
        team: savedTeam,
        externalLeagueId: lg.id,
        name: lg.name,
        shortName: lg.shortName,
        scoring: lg.scoring,
        leagueType: lg.leagueType,
        rawLeagueType: lg.rawLeagueType,
        closed: lg.closed,
        isAdmin: lg.isAdmin,
        canLeave: lg.canLeave,
        entryRank: lg.entryRank,
        entryLastRank: lg.entryLastRank,
        rankCount: lg.rankCount,
        entryPercentileRank: lg.entryPercentileRank,
        category: lg.category,
      }),
    );

    if (leagueEntities.length > 0) {
      await this.leagueRepository.save(leagueEntities);
    }

    return savedTeam;
  }

  /**
   * Get raw entry either from DB (if we have a snapshot) or by syncing from FPL once.
   * This is the "cached" entry: DB-first, FPL as fallback.
   */
  private async getOrSyncRawEntryForUser(
    userId: number,
  ): Promise<{ teamId: string; raw: RawFplEntry; lastSyncedAt: Date | null }> {
    // Try DB first
    const existingTeam = await this.teamRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existingTeam) {
      return {
        teamId: existingTeam.entryId,
        raw: existingTeam.raw,
        lastSyncedAt: existingTeam.lastSyncedAt ?? null,
      };
    }

    // If no snapshot, fetch from FPL and save
    const fresh = await this.fetchRawEntryForUser(userId);
    const savedTeam = await this.saveSnapshotForUser(
      userId,
      fresh.teamId,
      fresh.raw,
    );
    return {
      ...fresh,
      lastSyncedAt: savedTeam.lastSyncedAt,
    };
  }

  /**
   * Manual sync endpoint – always hits FPL, updates DB, and returns raw for debugging.
   */
  async syncTeamForUser(userId: number) {
    const { teamId, raw } = await this.fetchRawEntryForUser(userId);
    await this.saveSnapshotForUser(userId, teamId, raw);
    return { teamId, raw };
  }

  /**
   * Clean app-level "team overview" DTO for the frontend.
   * Uses DB snapshot if available; otherwise syncs once then returns overview.
   */
  async getTeamOverviewForUser(userId: number): Promise<FplTeamOverviewDto> {
    const { teamId, raw, lastSyncedAt } =
      await this.getOrSyncRawEntryForUser(userId);
    const base = mapEntryToOverview(teamId, raw);

    return {
      ...base,
      lastSyncedAt: lastSyncedAt ? lastSyncedAt.toISOString() : null,
    };
  }
}
