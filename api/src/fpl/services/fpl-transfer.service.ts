import { Injectable } from '@nestjs/common';
import { FplSquadService } from './fpl-squad.service';
import { FplFixturesService } from './fpl-fixtures.service';
import { FplTransferSuggestionDto } from '../dto/fpl-transfer-suggestion.dto';
import { FplPlayersService } from './fpl-players.service';

@Injectable()
export class FplTransferService {
  constructor(
    private readonly squadService: FplSquadService,
    private readonly fixturesService: FplFixturesService,
    private readonly playersService: FplPlayersService,
  ) {}

  async getTransferSuggestionsForUser(
    userId: number,
  ): Promise<FplTransferSuggestionDto[]> {
    const squad = await this.squadService.getCurrentSquadForUser(userId);
    const minMinutesPer90 =
      await this.fixturesService.getMinMinutesForPointsPerNinety();

    const allPlayers = await this.playersService.listPlayers({
      limit: 1000,
      minMinutes: minMinutesPer90,
      sortKey: 'POINTS_PER_90',
      sortDirection: 'DESC',
    });

    const ownedExternalIds = new Set<number>(
      [...squad.starting, ...squad.bench].map((p) => p.externalId),
    );

    const bank = squad.bank;
    const suggestions: FplTransferSuggestionDto[] = [];
    const maxPerFrom = 3;

    for (const from of squad.starting) {
      const fromPerNinety = from.pointsPerNinety;
      if (
        fromPerNinety === null ||
        from.minutes === null ||
        from.minutes < 180
      ) {
        continue;
      }

      const budget = from.nowCost + bank;
      let count = 0;

      for (const candidate of allPlayers) {
        if (count >= maxPerFrom) break;

        if (candidate.position !== from.position) continue;
        if (ownedExternalIds.has(candidate.externalId)) continue;
        if (candidate.nowCost > budget) continue;
        if (candidate.pointsPerNinety === null) continue;
        if (candidate.availability !== 'AVAILABLE') continue;

        const newBank = bank + from.nowCost - candidate.nowCost;
        if (newBank < 0) continue;

        const perNinetyDiff = candidate.pointsPerNinety - fromPerNinety;
        if (perNinetyDiff <= 0) continue;

        let ppmDiff: number | null = null;
        if (
          candidate.pointsPerMillion !== null &&
          from.pointsPerMillion !== null
        ) {
          ppmDiff = candidate.pointsPerMillion - from.pointsPerMillion;
        }

        suggestions.push({
          from,
          to: candidate,
          delta: {
            cost: candidate.nowCost - from.nowCost,
            bankRemaining: newBank,
            pointsPerNinetyDiff: Number(perNinetyDiff.toFixed(2)),
            pointsPerMillionDiff:
              ppmDiff !== null ? Number(ppmDiff.toFixed(2)) : null,
          },
        });

        count += 1;
      }
    }

    suggestions.sort((a, b) => {
      const aDiff = a.delta.pointsPerNinetyDiff ?? 0;
      const bDiff = b.delta.pointsPerNinetyDiff ?? 0;
      if (aDiff !== bDiff) return bDiff - aDiff;

      const aNext3 = a.to.next3DifficultySum ?? Number.POSITIVE_INFINITY;
      const bNext3 = b.to.next3DifficultySum ?? Number.POSITIVE_INFINITY;
      if (aNext3 !== bNext3) return aNext3 - bNext3;

      return a.delta.cost - b.delta.cost;
    });

    return suggestions.slice(0, 20);
  }
}
