import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FplApiClient } from './fpl-api.client';
import { FplClub } from '../entities/fpl-club.entity';
import { RawBootstrapEvent } from '../types/fpl-bootstrap-static.type';
import { RawFplFixture } from '../types/fpl-fixture.type';
import type { GameweekState } from '../types/fpl-gameweek-state.type';
import {
  FplFixtureTickerDto,
  FplFixtureTickerRowDto,
} from '../dto/fpl-fixture-ticker.dto';

@Injectable()
export class FplFixturesService {
  constructor(
    private readonly apiClient: FplApiClient,
    @InjectRepository(FplClub)
    private readonly clubRepository: Repository<FplClub>,
  ) {}

  private bootstrapEventsCache: RawBootstrapEvent[] | null = null;
  private bootstrapEventsFetchedAt: Date | null = null;

  private fixturesCache = new Map<
    number,
    { fixtures: RawFplFixture[]; fetchedAt: Date }
  >();

  private async loadBootstrapEvents(): Promise<RawBootstrapEvent[]> {
    const now = new Date();
    if (
      this.bootstrapEventsCache &&
      this.bootstrapEventsFetchedAt &&
      (now.getTime() - this.bootstrapEventsFetchedAt.getTime()) / 3600000 < 12
    ) {
      return this.bootstrapEventsCache;
    }

    const bootstrap = await this.apiClient.fetchBootstrapStatic();
    const events = bootstrap.events ?? [];
    this.bootstrapEventsCache = events;
    this.bootstrapEventsFetchedAt = now;
    return events;
  }

  private async loadFixturesForEvent(
    eventId: number,
  ): Promise<RawFplFixture[]> {
    const cached = this.fixturesCache.get(eventId);
    const now = new Date();

    if (cached && (now.getTime() - cached.fetchedAt.getTime()) / 3600000 < 12) {
      return cached.fixtures;
    }

    const fixtures = await this.apiClient.fetchFixturesForEvent(eventId);
    this.fixturesCache.set(eventId, { fixtures, fetchedAt: now });
    return fixtures;
  }

  async getFixtureTicker(numEvents = 5): Promise<FplFixtureTickerDto> {
    const events = await this.loadBootstrapEvents();
    if (events.length === 0) {
      return { events: [], rows: [] };
    }

    // Start from first unfinished event; fallback to last if all finished
    const firstUpcoming =
      events.find((e) => !e.finished) ?? events[events.length - 1];
    const startId = firstUpcoming.id;

    const eventIds = events
      .map((e) => e.id)
      .filter((id) => id >= startId)
      .slice(0, Math.max(1, Math.min(numEvents, 10)));

    const clubs = await this.clubRepository.find();
    const rowsMap = new Map<number, FplFixtureTickerRowDto>();

    for (const club of clubs) {
      rowsMap.set(club.externalId, {
        clubExternalId: club.externalId,
        clubShortName: club.shortName,
        fixtures: [],
      });
    }

    for (const eventId of eventIds) {
      const fixtures = await this.loadFixturesForEvent(eventId);

      for (const fx of fixtures) {
        if (!fx.event || fx.finished) continue; // If a fixture has finished, fixture ticker for that fixture will not appear

        const {
          team_h,
          team_a,
          team_h_difficulty,
          team_a_difficulty,
          kickoff_time,
        } = fx;

        const add = (
          clubExternalId: number,
          opponentExternalId: number,
          isHome: boolean,
          difficulty: number,
        ) => {
          const row = rowsMap.get(clubExternalId);
          const opponent = clubs.find(
            (c) => c.externalId === opponentExternalId,
          );
          if (!row || !opponent) return;

          row.fixtures.push({
            event: eventId,
            kickoffTime: kickoff_time,
            isHome,
            opponentExternalId,
            opponentShortName: opponent.shortName,
            difficulty,
          });
        };

        add(team_h, team_a, true, team_h_difficulty);
        add(team_a, team_h, false, team_a_difficulty);
      }
    }

    // Sort fixtures per team by event then kickoff
    for (const row of rowsMap.values()) {
      row.fixtures.sort((a, b) => {
        if (a.event !== b.event) return a.event - b.event;
        if (!a.kickoffTime || !b.kickoffTime) return 0;
        return (
          new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime()
        );
      });
    }

    return {
      events: eventIds,
      rows: Array.from(rowsMap.values()).filter((r) => r.fixtures.length > 0),
    };
  }

  async getGameweekState(
    currentEventId: number,
    now: Date,
  ): Promise<GameweekState> {
    const events = await this.loadBootstrapEvents();
    const event = events.find((e) => e.id === currentEventId);
    if (!event) {
      return 'GW_FINAL_OR_OFF';
    }

    const deadline = new Date(event.deadline_time);

    if (now < deadline) {
      return 'PRE_DEADLINE';
    }

    if (event.finished && event.data_checked) {
      return 'GW_FINAL_OR_OFF';
    }

    if (event.finished && !event.data_checked) {
      return 'GW_FINISHED_NOT_FINAL';
    }

    const fixtures = await this.loadFixturesForEvent(currentEventId);
    const windowBeforeMinutes = 30;
    const windowAfterMinutes = 150;

    const isLiveFixture = fixtures.some((f) => {
      if (!f.kickoff_time) return false;
      const ko = new Date(f.kickoff_time);
      const diffMinutes = (now.getTime() - ko.getTime()) / 60000;
      return (
        diffMinutes >= -windowBeforeMinutes &&
        diffMinutes <= windowAfterMinutes &&
        !f.finished
      );
    });

    if (isLiveFixture) {
      return 'DURING_MATCH_WINDOW';
    }

    return 'BETWEEN_MATCHES_IN_GW';
  }

  getMaxAgeMinutesForState(state: GameweekState): number {
    switch (state) {
      case 'DURING_MATCH_WINDOW':
        return 10; // very fresh while matches are live
      case 'PRE_DEADLINE':
      case 'BETWEEN_MATCHES_IN_GW':
      case 'GW_FINISHED_NOT_FINAL':
        return 60; // about hourly during an active GW
      case 'GW_FINAL_OR_OFF':
      default:
        return 12 * 60; // relaxed between gameweeks
    }
  }

  async getMinMinutesForPointsPerNinety(): Promise<number> {
    const events = await this.loadBootstrapEvents();
    if (events.length === 0) {
      return 60; // fallback: one gameweek
    }

    // Count events that are effectively "played"
    const playedCount = events.filter(
      (e) => e.finished || e.data_checked,
    ).length;

    const gwCount = playedCount > 0 ? playedCount : 1;
    return gwCount * 60; // 60 mins per GW
  }

  async getUpcomingFixtureDifficultySumsByClub(): Promise<
    Map<number, { next3: number | null; next5: number | null }>
  > {
    type ClubFixtureDifficulty = {
      event: number;
      difficulty: number;
    };

    const events = await this.loadBootstrapEvents();
    if (events.length === 0) return new Map();

    const firstUpcoming =
      events.find((e) => !e.finished) ?? events[events.length - 1];
    const eventIds = events
      .map((e) => e.id)
      .filter((id) => id >= firstUpcoming.id)
      .slice(0, 5); // up to next 5 GWs

    const byClub = new Map<number, ClubFixtureDifficulty[]>();

    for (const eventId of eventIds) {
      const fixtures = await this.loadFixturesForEvent(eventId);

      for (const fx of fixtures) {
        if (!fx.event || fx.finished) continue;

        const add = (clubId: number, difficulty: number) => {
          const arr = byClub.get(clubId) ?? [];
          arr.push({ event: eventId, difficulty });
          byClub.set(clubId, arr);
        };

        add(fx.team_h, fx.team_h_difficulty);
        add(fx.team_a, fx.team_a_difficulty);
      }
    }

    const result = new Map<
      number,
      { next3: number | null; next5: number | null }
    >();

    for (const [clubId, fixtures] of byClub.entries()) {
      fixtures.sort((a, b) => a.event - b.event);

      const slice3 = fixtures.slice(0, 3);
      const slice5 = fixtures.slice(0, 5);

      const d3 = slice3.reduce((sum, f) => sum + f.difficulty, 0);
      const d5 = slice5.reduce((sum, f) => sum + f.difficulty, 0);

      result.set(clubId, {
        next3: fixtures.length ? d3 : null,
        next5: fixtures.length ? d5 : null,
      });
    }

    return result;
  }
}
