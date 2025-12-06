import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FplApiClient } from './fpl-api.client';
import { FplClub } from '../entities/fpl-club.entity';
import { FplPlayer } from '../entities/fpl-player.entity';
import { RawBootstrapStatic } from '../types/fpl-bootstrap-static.type';
import { mapElementTypeToPosition } from '../utils/fpl-mappers.util';

@Injectable()
export class FplBootstrapService {
  constructor(
    private readonly apiClient: FplApiClient,
    @InjectRepository(FplClub)
    private readonly clubRepository: Repository<FplClub>,
    @InjectRepository(FplPlayer)
    private readonly playerRepository: Repository<FplPlayer>,
  ) {}

  private async fetchBootstrapStatic(): Promise<RawBootstrapStatic> {
    return this.apiClient.fetchBootstrapStatic();
  }

  async syncBootstrapData() {
    const bootstrap = await this.fetchBootstrapStatic();

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
}
