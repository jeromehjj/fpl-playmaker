import { Injectable } from '@nestjs/common';
import { FplPlayerListItemDto } from './dto/fpl-player.dto';
import { ListPlayersOptions } from './types/fpl-list-player-options.type';
import { FplFixtureTickerDto } from './dto/fpl-fixture-ticker.dto';
import { FplFixturesService } from './services/fpl-fixtures.service';
import { FplTeamService } from './services/fpl-team.service';
import { FplSquadService } from './services/fpl-squad.service';
import { FplPlayersService } from './services/fpl-players.service';
import { FplBootstrapService } from './services/fpl-bootstrap.service';
import { FplTransferService } from './services/fpl-transfer.service';
import { FplTransferSuggestionDto } from './dto/fpl-transfer-suggestion.dto';

@Injectable()
export class FplService {
  constructor(
    private readonly fixturesService: FplFixturesService,
    private readonly teamService: FplTeamService,
    private readonly squadService: FplSquadService,
    private readonly playersService: FplPlayersService,
    private readonly bootstrapService: FplBootstrapService,
    private readonly transferService: FplTransferService,
  ) {}

  async getFixtureTicker(numEvents = 5): Promise<FplFixtureTickerDto> {
    return this.fixturesService.getFixtureTicker(numEvents);
  }

  /**
   * Sync clubs and players from bootstrap-static into the DB.
   */
  async syncBootstrapData() {
    return this.bootstrapService.syncBootstrapData();
  }

  async listPlayers(
    options: ListPlayersOptions = {},
  ): Promise<FplPlayerListItemDto[]> {
    return this.playersService.listPlayers(options);
  }

  async getCurrentSquadForUser(userId: number) {
    return this.squadService.getCurrentSquadForUser(userId);
  }

  /**
   * Manual sync endpoint – always hits FPL, updates DB, and returns raw for debugging.
   */
  async syncTeamForUser(userId: number) {
    return this.teamService.syncTeamForUser(userId);
  }

  /**
   * Clean app-level "team overview" DTO for the frontend.
   * Uses DB snapshot if available; otherwise syncs once then returns overview.
   */
  async getTeamOverviewForUser(userId: number) {
    return this.teamService.getTeamOverviewForUser(userId);
  }

  async getTransferSuggestionsForUser(
    userId: number,
  ): Promise<FplTransferSuggestionDto[]> {
    return this.transferService.getTransferSuggestionsForUser(userId);
  }
}
