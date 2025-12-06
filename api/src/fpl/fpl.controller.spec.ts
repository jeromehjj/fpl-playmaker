import { Test, TestingModule } from '@nestjs/testing';
import { FplController } from './fpl.controller';
import { FplService } from './fpl.service';
import type { AuthRequest } from '../auth/types/auth-request.type';

describe('FplController', () => {
  let controller: FplController;
  let fplService: jest.Mocked<FplService>;

  beforeEach(async () => {
    fplService = {
      syncTeamForUser: jest.fn(),
      syncBootstrapData: jest.fn(),
      getFixtureTicker: jest.fn(),
      listPlayers: jest.fn(),
      getCurrentSquadForUser: jest.fn(),
      getTeamOverviewForUser: jest.fn(),
      getTransferSuggestionsForUser: jest.fn(),
    } as unknown as jest.Mocked<FplService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FplController],
      providers: [{ provide: FplService, useValue: fplService }],
    }).compile();

    controller = module.get<FplController>(FplController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('syncTeam should call service with userId', async () => {
    const req = { user: { userId: 42 } } as AuthRequest;
    await controller.syncTeam(req);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(fplService.syncTeamForUser).toHaveBeenCalledWith(42);
  });

  it('syncBootstrap should call service', async () => {
    await controller.syncBootstrap();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(fplService.syncBootstrapData).toHaveBeenCalled();
  });

  it('getFixtureTicker should call service with parsed events', async () => {
    await controller.getFixtureTicker('7');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(fplService.getFixtureTicker).toHaveBeenCalledWith(7);
  });

  it('getTransferSuggestions should call service with userId', async () => {
    const req = { user: { userId: 99 } } as AuthRequest;
    await controller.getTransferSuggestions(req);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(fplService.getTransferSuggestionsForUser).toHaveBeenCalledWith(99);
  });
});
