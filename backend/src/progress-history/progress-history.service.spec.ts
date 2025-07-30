import { Test, TestingModule } from '@nestjs/testing';
import { ProgressHistoryService } from './progress-history.service';

describe('ProgressHistoryService', () => {
  let service: ProgressHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgressHistoryService],
    }).compile();

    service = module.get<ProgressHistoryService>(ProgressHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
