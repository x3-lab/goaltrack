import { Test, TestingModule } from '@nestjs/testing';
import { ProgressHistoryController } from './progress-history.controller';

describe('ProgressHistoryController', () => {
  let controller: ProgressHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressHistoryController],
    }).compile();

    controller = module.get<ProgressHistoryController>(ProgressHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
