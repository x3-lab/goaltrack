import { Test, TestingModule } from '@nestjs/testing';
import { GoalTemplatesController } from './goal-templates.controller';
import { GoalTemplatesService } from './goal-templates.service';

describe('GoalTemplatesController', () => {
  let controller: GoalTemplatesController;

  const mockGoalTemplatesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    duplicate: jest.fn(),
    useTemplate: jest.fn(),
    getCategories: jest.fn(),
    getPopularTemplates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalTemplatesController],
      providers: [
        {
          provide: GoalTemplatesService,
          useValue: mockGoalTemplatesService,
        },
      ],
    }).compile();

    controller = module.get<GoalTemplatesController>(GoalTemplatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
