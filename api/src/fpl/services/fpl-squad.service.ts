import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FplApiClient } from './fpl-api.client';
import { FplTeamService } from './fpl-team.service';
import { FplFixturesService } from './fpl-fixtures.service';
import { FplPlayer } from '../entities/fpl-player.entity';
import { FplSquadDto } from '../dto/fpl-squad.dto';
import { RawFplPicksResponse } from '../types/fpl-picks.type';
import { RawBootstrapPlayer } from '../types/fpl-bootstrap-static.type';
import { getAvailabilityFromRaw } from '../utils/fpl-availability.util';

@Injectable()
export class FplSquadService {
  constructor(
    private readonly apiClient: FplApiClient,
    private readonly teamService: FplTeamService,
    private readonly fixturesService: FplFixturesService,
    @InjectRepository(FplPlayer)
    private readonly playerRepository: Repository<FplPlayer>,
  ) {}

  private async fetchPicksForUser(userId: number): Promise<{
    teamId: string;
    currentEvent: number;
    raw: RawFplPicksResponse;
  }> {
    const { teamId, raw: entryRaw } =
      await this.teamService.getOrSyncRawEntryForUser(userId);
    const currentEvent = entryRaw.current_event;

    if (!currentEvent) {
      throw new BadRequestException(
        'Current event is not available for this team',
      );
    }

    const raw = await this.apiClient.fetchEntryPicks(teamId, currentEvent);
    return { teamId, currentEvent, raw };
  }

  private async fetchEventLivePoints(
    eventId: number,
  ): Promise<Map<number, number>> {
    const data = await this.apiClient.fetchEventLive(eventId);
    const map = new Map<number, number>();
    for (const el of data.elements ?? []) {
      map.set(el.id, el.stats?.total_points ?? 0);
    }
    return map;
  }

  /**
   * Return current gameweek squad (XI + bench) mapped to stored players.
   */
  async getCurrentSquadForUser(userId: number): Promise<FplSquadDto> {
    const { teamId, currentEvent, raw } = await this.fetchPicksForUser(userId);
    const livePointsByElement = await this.fetchEventLivePoints(currentEvent);

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
    const difficultyByClub =
      await this.fixturesService.getUpcomingFixtureDifficultySumsByClub();

    const starting: FplSquadDto['starting'] = [];
    const bench: FplSquadDto['bench'] = [];

    for (const pick of raw.picks) {
      const player = byExternalId.get(pick.element);
      if (!player) {
        continue;
      }

      const isStarting = pick.position <= 11;
      const rawPlayer = (player.raw ?? null) as RawBootstrapPlayer | null;
      const availability = getAvailabilityFromRaw(rawPlayer);

      const valueMillions = player.nowCost / 10;
      const totalPoints = rawPlayer?.total_points ?? null;
      let pointsPerGame: number | null = null;

      if (rawPlayer && typeof rawPlayer.points_per_game === 'string') {
        const parsed = Number.parseFloat(rawPlayer.points_per_game);
        pointsPerGame = Number.isNaN(parsed) ? null : parsed;
      }

      const minutes = rawPlayer?.minutes ?? null;
      const pointsPerMillion =
        totalPoints !== null && valueMillions > 0
          ? Number((totalPoints / valueMillions).toFixed(2))
          : null;

      const pointsPerNinety =
        totalPoints !== null && minutes !== null && minutes > 0
          ? Number(((totalPoints * 90) / minutes).toFixed(2))
          : null;

      const sums = difficultyByClub.get(player.club.externalId) ?? {
        next3: null,
        next5: null,
      };

      const gwPoints = livePointsByElement.get(player.externalId) ?? null;

      const dto = {
        id: player.id,
        externalId: player.externalId,
        webName: player.webName,
        fullName: player.fullName,
        position: player.position,
        nowCost: player.nowCost,
        gwPoints,
        next3DifficultySum: sums.next3,
        next5DifficultySum: sums.next5,
        valueMillions,
        totalPoints,
        pointsPerGame,
        pointsPerMillion,
        pointsPerNinety,
        availability,
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
}
