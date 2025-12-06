import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RawBootstrapStatic } from '../types/fpl-bootstrap-static.type';
import { RawFplEntry } from '../types/fpl-raw-types';
import { RawFplPicksResponse } from '../types/fpl-picks.type';
import { RawFplFixture } from '../types/fpl-fixture.type';
import { RawEventLiveResponse } from '../types/fpl-live-event.type';

@Injectable()
export class FplApiClient {
  private readonly baseUrl = 'https://fantasy.premierleague.com/api';

  private async fetchJson<T>(path: string, upstreamName: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      throw new InternalServerErrorException(`Failed to call ${upstreamName}`);
    }

    if (!response.ok) {
      throw new BadGatewayException({
        statusCode: 502,
        code: 'FPL_UPSTREAM_ERROR',
        message: `${upstreamName} responded with status ${response.status}`,
      });
    }

    return (await response.json()) as T;
  }

  fetchBootstrapStatic(): Promise<RawBootstrapStatic> {
    return this.fetchJson<RawBootstrapStatic>('/bootstrap-static/', 'FPL API');
  }

  fetchEntry(teamId: string): Promise<RawFplEntry> {
    return this.fetchJson<RawFplEntry>(`/entry/${teamId}/`, 'FPL entry API');
  }

  fetchEntryPicks(
    teamId: string,
    eventId: number,
  ): Promise<RawFplPicksResponse> {
    return this.fetchJson<RawFplPicksResponse>(
      `/entry/${teamId}/event/${eventId}/picks/`,
      'FPL picks API',
    );
  }

  fetchEventLive(eventId: number): Promise<RawEventLiveResponse> {
    return this.fetchJson<RawEventLiveResponse>(
      `/event/${eventId}/live/`,
      'FPL live API',
    );
  }

  fetchFixturesForEvent(eventId: number): Promise<RawFplFixture[]> {
    return this.fetchJson<RawFplFixture[]>(
      `/fixtures/?event=${eventId}`,
      'FPL fixtures API',
    );
  }
}
