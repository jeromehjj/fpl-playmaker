import { Test, TestingModule } from '@nestjs/testing';
import { FplService } from './fpl.service';

describe('FplService', () => {
  let service: FplService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FplService],
    }).compile();

    service = module.get<FplService>(FplService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
