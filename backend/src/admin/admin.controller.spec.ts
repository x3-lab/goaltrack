import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;

  const mockAdminService = {
    getSystemStats: jest.fn(),
    getUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUserStatus: jest.fn(),
    deleteUser: jest.fn(),
    getGoals: jest.fn(),
    getActivityLogs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
