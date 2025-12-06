import { Test, TestingModule } from '@nestjs/testing';
import { FplService } from './fpl.service';
import { FplFixturesService } from './services/fpl-fixtures.service';
import { FplTeamService } from './services/fpl-team.service';
import { FplSquadService } from './services/fpl-squad.service';
import { FplPlayersService } from './services/fpl-players.service';
import { FplBootstrapService } from './services/fpl-bootstrap.service';
import { FplTransferService } from './services/fpl-transfer.service';
import type { FplSquadDto } from './dto/fpl-squad.dto';
import type { FplTeamOverviewDto } from './dto/fpl-team-overview.dto';
import type { FplTransferSuggestionDto } from './dto/fpl-transfer-suggestion.dto';
import type { RawFplEntry } from './types/fpl-raw-types';

describe('FplService', () => {
  let service: FplService;
  let fixturesService: jest.Mocked<FplFixturesService>;
  let teamService: jest.Mocked<FplTeamService>;
  let squadService: jest.Mocked<FplSquadService>;
  let playersService: jest.Mocked<FplPlayersService>;
  let bootstrapService: jest.Mocked<FplBootstrapService>;
  let transferService: jest.Mocked<FplTransferService>;

  beforeEach(async () => {
    fixturesService = {
      getFixtureTicker: jest.fn(),
    } as unknown as jest.Mocked<FplFixturesService>;

    teamService = {
      syncTeamForUser: jest.fn(),
      getTeamOverviewForUser: jest.fn(),
    } as unknown as jest.Mocked<FplTeamService>;

    squadService = {
      getCurrentSquadForUser: jest.fn(),
    } as unknown as jest.Mocked<FplSquadService>;

    playersService = {
      listPlayers: jest.fn(),
    } as unknown as jest.Mocked<FplPlayersService>;

    bootstrapService = {
      syncBootstrapData: jest.fn(),
    } as unknown as jest.Mocked<FplBootstrapService>;

    transferService = {
      getTransferSuggestionsForUser: jest.fn(),
    } as unknown as jest.Mocked<FplTransferService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FplService,
        { provide: FplFixturesService, useValue: fixturesService },
        { provide: FplTeamService, useValue: teamService },
        { provide: FplSquadService, useValue: squadService },
        { provide: FplPlayersService, useValue: playersService },
        { provide: FplBootstrapService, useValue: bootstrapService },
        { provide: FplTransferService, useValue: transferService },
      ],
    }).compile();

    service = module.get<FplService>(FplService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getFixtureTicker should delegate to fixturesService', async () => {
    fixturesService.getFixtureTicker.mockResolvedValue({
      events: [],
      rows: [],
    });

    const result = await service.getFixtureTicker(3);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(fixturesService.getFixtureTicker).toHaveBeenCalledWith(3);
    expect(result).toEqual({ events: [], rows: [] });
  });

  it('syncBootstrapData should delegate to bootstrapService', async () => {
    bootstrapService.syncBootstrapData.mockResolvedValue({
      clubsSynced: 20,
      playersSynced: 500,
    });

    const result = await service.syncBootstrapData();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(bootstrapService.syncBootstrapData).toHaveBeenCalled();
    expect(result).toEqual({
      clubsSynced: 20,
      playersSynced: 500,
    });
  });

  it('listPlayers should delegate to playersService', async () => {
    playersService.listPlayers.mockResolvedValue([]);

    const options = { limit: 10 };
    const result = await service.listPlayers(options);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(playersService.listPlayers).toHaveBeenCalledWith(options);
    expect(result).toEqual([]);
  });

  it('getCurrentSquadForUser should delegate to squadService', async () => {
    const squad: FplSquadDto = {
      event: 1,
      teamId: '1',
      value: 0,
      bank: 0,
      starting: [],
      bench: [],
    };
    squadService.getCurrentSquadForUser.mockResolvedValue(squad);

    const result = await service.getCurrentSquadForUser(123);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(squadService.getCurrentSquadForUser).toHaveBeenCalledWith(123);
    expect(result).toEqual(squad);
  });

  it('syncTeamForUser should delegate to teamService', async () => {
    const payload: { teamId: string; raw: RawFplEntry } = {
      teamId: '1',
      raw: {} as RawFplEntry,
    };
    teamService.syncTeamForUser.mockResolvedValue(payload);

    const result = await service.syncTeamForUser(123);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(teamService.syncTeamForUser).toHaveBeenCalledWith(123);
    expect(result).toEqual(payload);
  });

  it('getTeamOverviewForUser should delegate to teamService', async () => {
    const overview: FplTeamOverviewDto = {
      teamId: '1',
      teamName: 'Team',
      managerName: 'Manager',
      region: 'Region',
      regionCode: 'RC',
      overallPoints: 0,
      overallRank: 0,
      gwPoints: 0,
      gwRank: 0,
      currentEvent: 1,
      leagues: [],
      lastSyncedAt: null,
    };
    teamService.getTeamOverviewForUser.mockResolvedValue(overview);

    const result = await service.getTeamOverviewForUser(123);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(teamService.getTeamOverviewForUser).toHaveBeenCalledWith(123);
    expect(result).toEqual(overview);
  });

  it('getTransferSuggestionsForUser should delegate to transferService', async () => {
    const suggestions: FplTransferSuggestionDto[] = [];
    transferService.getTransferSuggestionsForUser.mockResolvedValue(
      suggestions,
    );

    const result = await service.getTransferSuggestionsForUser(123);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(transferService.getTransferSuggestionsForUser).toHaveBeenCalledWith(
      123,
    );
    expect(result).toEqual(suggestions);
  });
});
