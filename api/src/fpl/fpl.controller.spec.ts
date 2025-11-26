import { Test, TestingModule } from '@nestjs/testing';
import { FplController } from './fpl.controller';

describe('FplController', () => {
  let controller: FplController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FplController],
    }).compile();

    controller = module.get<FplController>(FplController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
