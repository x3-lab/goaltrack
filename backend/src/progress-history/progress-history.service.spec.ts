import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProgressHistoryService } from './progress-history.service';
import { ProgressHistory, Goal, User, ActivityLog } from '../database/entities';

describe('ProgressHistoryService', () => {
  let service: ProgressHistoryService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressHistoryService,
        {
          provide: getRepositoryToken(ProgressHistory),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Goal),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProgressHistoryService>(ProgressHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
