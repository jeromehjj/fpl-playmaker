import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FplPlayer } from '../entities/fpl-player.entity';
import { FplFixturesService } from './fpl-fixtures.service';
import { ListPlayersOptions } from '../types/fpl-list-player-options.type';
import { FplPlayerListItemDto } from '../dto/fpl-player.dto';
import { RawBootstrapPlayer } from '../types/fpl-bootstrap-static.type';
import { getAvailabilityFromRaw } from '../utils/fpl-availability.util';

@Injectable()
export class FplPlayersService {
  constructor(
    @InjectRepository(FplPlayer)
    private readonly playerRepository: Repository<FplPlayer>,
    private readonly fixturesService: FplFixturesService,
  ) {}

  async listPlayers(
    options: ListPlayersOptions = {},
  ): Promise<FplPlayerListItemDto[]> {
    const {
      clubExternalId,
      position,
      search,
      offset = 0,
      limit = 50,
      minMinutes,
      sortKey,
      sortDirection,
    } = options;

    const qb = this.playerRepository
      .createQueryBuilder('player')
      .leftJoinAndSelect('player.club', 'club')
      .limit(Math.min(Math.max(limit, 1), 200))
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

    if (minMinutes !== undefined) {
      qb.andWhere(`(player.raw->>'minutes')::int >= :minMinutes`, {
        minMinutes,
      });
    }

    const direction = sortDirection === 'ASC' ? 'ASC' : 'DESC';
    let orderExpr: string;

    switch (sortKey) {
      case 'TOTAL_POINTS':
        orderExpr = "(player.raw->>'total_points')::int";
        break;
      case 'POINTS_PER_GAME':
        orderExpr = "(player.raw->>'points_per_game')::float";
        break;
      case 'MINUTES':
        orderExpr = "(player.raw->>'minutes')::int";
        break;
      case 'POINTS_PER_MILLION':
        orderExpr =
          "CASE WHEN player.nowCost > 0 THEN (player.raw->>'total_points')::float / (player.nowCost / 10.0) ELSE 0 END";
        break;
      case 'POINTS_PER_90':
        orderExpr =
          "CASE WHEN (player.raw->>'minutes')::int > 0 THEN ((player.raw->>'total_points')::float * 90) / (player.raw->>'minutes')::int ELSE 0 END";
        break;
      case 'PRICE':
      default:
        orderExpr = 'player.nowCost';
        break;
    }

    qb.orderBy(orderExpr, direction).addOrderBy('player.webName', 'ASC');

    const players = await qb.getMany();
    const difficultyByClub =
      await this.fixturesService.getUpcomingFixtureDifficultySumsByClub();

    return players.map((p) => {
      const raw = (p.raw ?? null) as RawBootstrapPlayer | null;
      const availability = getAvailabilityFromRaw(raw);
      const sums = difficultyByClub.get(p.club.externalId) ?? {
        next3: null,
        next5: null,
      };

      const valueMillions = p.nowCost / 10;
      const totalPoints = raw?.total_points ?? null;
      let pointsPerGame: number | null = null;

      if (raw && typeof raw.points_per_game === 'string') {
        const parsed = Number.parseFloat(raw.points_per_game);
        pointsPerGame = Number.isNaN(parsed) ? null : parsed;
      }

      const minutes = raw?.minutes ?? null;
      const pointsPerMillion =
        totalPoints !== null && valueMillions > 0
          ? Number((totalPoints / valueMillions).toFixed(2))
          : null;

      const pointsPerNinety =
        totalPoints !== null && minutes !== null && minutes > 0
          ? Number(((totalPoints * 90) / minutes).toFixed(2))
          : null;

      return {
        id: p.id,
        externalId: p.externalId,
        webName: p.webName,
        fullName: p.fullName,
        position: p.position,
        nowCost: p.nowCost,
        next3DifficultySum: sums.next3,
        next5DifficultySum: sums.next5,
        valueMillions,
        totalPoints,
        pointsPerGame,
        pointsPerMillion,
        minutes,
        pointsPerNinety,
        availability,
        club: {
          id: p.club.id,
          externalId: p.club.externalId,
          name: p.club.name,
          shortName: p.club.shortName,
        },
      };
    });
  }
}
