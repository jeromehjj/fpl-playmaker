import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RawFplEntry } from './types/fpl-raw-types';
import { FplTeamOverviewDto } from './dto/fpl-team-overview.dto';
import { mapEntryToOverview } from './utils/fpl-mappers.util';
import { FplTeam } from './entities/fpl-team.entity';
import { FplLeague } from './entities/fpl-league.entity';
import { User } from '../users/user.entity';

@Injectable()
export class FplService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(FplTeam)
    private readonly teamRepository: Repository<FplTeam>,
    @InjectRepository(FplLeague)
    private readonly leagueRepository: Repository<FplLeague>,
  ) {}

  /**
   * Helper: load user and ensure they have an FPL team id.
   */
  private async getUserAndTeamIdOrThrow(
    userId: number,
  ): Promise<{ user: User; teamId: string }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.fplTeamId) {
      throw new BadRequestException('User has no FPL team ID set');
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
      throw new BadRequestException(
        `FPL API responded with status ${response.status}`,
      );
    }

    const data = (await response.json()) as RawFplEntry;

    return { teamId, raw: data };
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
        raw: existingTeam.raw as RawFplEntry,
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
