import { Test, TestingModule } from '@nestjs/testing';
import { ProgressHistoryController } from './progress-history.controller';
import { ProgressHistoryService } from './progress-history.service';

describe('ProgressHistoryController', () => {
  let controller: ProgressHistoryController;

  const mockProgressHistoryService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getGoalProgress: jest.fn(),
    getUserProgress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressHistoryController],
      providers: [
        {
          provide: ProgressHistoryService,
          useValue: mockProgressHistoryService,
        },
      ],
    }).compile();

    controller = module.get<ProgressHistoryController>(ProgressHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
