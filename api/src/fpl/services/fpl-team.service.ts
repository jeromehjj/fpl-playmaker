import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../users/users.service';
import { FplTeam } from '../entities/fpl-team.entity';
import { FplLeague } from '../entities/fpl-league.entity';
import { User } from '../../users/user.entity';
import { RawFplEntry } from '../types/fpl-raw-types';
import { FplTeamOverviewDto } from '../dto/fpl-team-overview.dto';
import { mapEntryToOverview } from '../utils/fpl-mappers.util';
import { FplApiClient } from './fpl-api.client';
import { FplFixturesService } from './fpl-fixtures.service';

@Injectable()
export class FplTeamService {
  constructor(
    private readonly usersService: UsersService,
    private readonly apiClient: FplApiClient,
    private readonly fixturesService: FplFixturesService,
    @InjectRepository(FplTeam)
    private readonly teamRepository: Repository<FplTeam>,
    @InjectRepository(FplLeague)
    private readonly leagueRepository: Repository<FplLeague>,
  ) {}

  private async getUserAndTeamIdOrThrow(
    userId: number,
  ): Promise<{ user: User; teamId: string }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.fplTeamId) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'NO_FPL_TEAM',
        message: 'User has no FPL team ID set',
      });
    }
    return { user, teamId: user.fplTeamId };
  }

  private async fetchRawEntryForUser(
    userId: number,
  ): Promise<{ teamId: string; raw: RawFplEntry }> {
    const { teamId } = await this.getUserAndTeamIdOrThrow(userId);
    const raw = await this.apiClient.fetchEntry(teamId);
    return { teamId, raw };
  }

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
  async getOrSyncRawEntryForUser(
    userId: number,
  ): Promise<{ teamId: string; raw: RawFplEntry; lastSyncedAt: Date | null }> {
    // Try DB first
    const existingTeam = await this.teamRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existingTeam) {
      const now = new Date();
      const lastSyncedAt = existingTeam.lastSyncedAt ?? new Date(0);
      const ageMinutes = (now.getTime() - lastSyncedAt.getTime()) / 60000;

      const currentEventId = (existingTeam.raw as RawFplEntry | null)
        ?.current_event;

      let maxAgeMinutes = 60; // default fallback

      if (currentEventId) {
        const state = await this.fixturesService.getGameweekState(
          currentEventId,
          now,
        );
        maxAgeMinutes = this.fixturesService.getMaxAgeMinutesForState(state);
      }
      if (ageMinutes <= maxAgeMinutes) {
        return {
          teamId: existingTeam.entryId,
          raw: existingTeam.raw,
          lastSyncedAt: existingTeam.lastSyncedAt ?? null,
        };
      }
    }

    // If no snapshot or too old for current GW state, fetch from FPL & save
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
