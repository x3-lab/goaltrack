import { usersApi } from './usersApi';
import type { User } from '../types/api';
import type { CreateVolunteerRequest } from './usersApi';

export class UserTestSuite {
  private results: Array<{ test: string; success: boolean; error?: string }> = [];

  async runAllTests(): Promise<void> {
    console.log('👥 Starting User Management Integration Tests...');
    
    await this.testUserCRUDOperations();
    
    await this.testUserFiltering();
    
    await this.testErrorHandling();
    
    this.displayResults();
  }

  private async testUserCRUDOperations(): Promise<void> {
    try {
      const users = await usersApi.getAll();
      this.addResult('Get all users', Array.isArray(users), 'Should return array of users');

      if (users.length > 0) {
        const firstUser = users[0];
        const user = await usersApi.getById(firstUser.id);
        this.addResult('Get user by ID', !!user && user.id === firstUser.id);

        const updateData = { name: `${firstUser.name} (Updated)` };
        const updatedUser = await usersApi.update(firstUser.id, updateData);
        this.addResult('Update user', updatedUser.name.includes('(Updated)'));

        await usersApi.update(firstUser.id, { name: firstUser.name });
      }

      try {
        const newUser: CreateVolunteerRequest = {
          name: 'Test User',
          email: `test.${Date.now()}@example.com`,
          password: 'password123',
          phone: '123-456-7890',
          role: 'volunteer'
        };
        
        const createdUser = await usersApi.create(newUser);
        this.addResult('Create user', !!createdUser && createdUser.email === newUser.email);

        if (createdUser) {
          await usersApi.delete(createdUser.id);
          this.addResult('Delete user', true);
        }
      } catch (error) {
        this.addResult('Create user', false, 'Expected - may fail due to validation or constraints');
      }

    } catch (error: any) {
      this.addResult('User CRUD operations', false, error.message);
    }
  }

  private async testUserFiltering(): Promise<void> {
    try {
      const volunteers = await usersApi.getAll({ role: 'volunteer' });
      const allVolunteers = volunteers.every((user: User) => user.role === 'volunteer');
      this.addResult('Filter by role', allVolunteers);

      const activeUsers = await usersApi.getAll({ status: 'active' });
      const allActive = activeUsers.every((user: User) => user.status === 'active');
      this.addResult('Filter by status', allActive);

      if (volunteers.length > 0) {
        const searchTerm = volunteers[0].name.split(' ')[0];
        const searchResults = await usersApi.getAll({ search: searchTerm });
        const hasResults = searchResults.length > 0;
        this.addResult('Search functionality', hasResults);
      }

    } catch (error: any) {
      this.addResult('User filtering', false, error.message);
    }
  }

  private async testErrorHandling(): Promise<void> {
    try {
      try {
        await usersApi.getById('non-existent-id');
        this.addResult('Handle non-existent user', false, 'Should have thrown error');
      } catch (error) {
        this.addResult('Handle non-existent user', true, 'Correctly handles missing user');
      }

      try {
        await usersApi.update('non-existent-id', { name: 'Test' });
        this.addResult('Handle update non-existent user', false, 'Should have thrown error');
      } catch (error) {
        this.addResult('Handle update non-existent user', true, 'Correctly handles missing user');
      }

      try {
        await usersApi.create({
          name: '',
          email: 'invalid-email',
          password: '123',
          role: 'volunteer'
        } as CreateVolunteerRequest);
        this.addResult('Handle invalid create data', false, 'Should have thrown validation error');
      } catch (error) {
        this.addResult('Handle invalid create data', true, 'Correctly validates input');
      }

    } catch (error: any) {
      this.addResult('Error handling', false, error.message);
    }
  }

  private addResult(test: string, success: boolean, error?: string): void {
    this.results.push({ test, success, error });
  }

  private displayResults(): void {
    console.log('\n👥 User Management Test Results:');
    console.log('='.repeat(50));
    
    this.results.forEach(({ test, success, error }) => {
      const icon = success ? '✅' : '❌';
      console.log(`${icon} ${test}`);
      if (error) {
        console.log(`   └─ ${error}`);
      }
    });
    
    const passedTests = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;
    
    console.log('='.repeat(50));
    console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All user management tests passed! Ready for goals integration.');
    } else {
      console.log('⚠️  Some user management tests failed. Check your implementation.');
    }
  }
}

export const runUserTests = () => {
  const testSuite = new UserTestSuite();
  return testSuite.runAllTests();
};

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await runUserTests();
    } catch (error) {
      console.error('Test run failed:', error);
      process.exit(1);
    }
  })();
}