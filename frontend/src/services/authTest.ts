import { authApi } from './authApi';

export class AuthTestSuite {
  private results: Array<{ test: string; success: boolean; error?: string }> = [];

  async runAllTests(): Promise<void> {
    console.log('🔐 Starting Authentication Integration Tests...');
    
    await this.testAuthEndpoints();
    
    await this.testTokenManagement();
    
    this.displayResults();
  }

  private async testAuthEndpoints(): Promise<void> {
    // Test login with invalid credentials (should fail gracefully)
    try {
      await authApi.login({ email: 'invalid@test.com', password: 'wrongpassword' });
      this.addResult('Login with invalid credentials', false, 'Should have failed');
    } catch (error: any) {
      if (error.message.includes('Invalid credentials') || error.message.includes('Unauthorized')) {
        this.addResult('Login with invalid credentials', true, 'Correctly rejected');
      } else {
        this.addResult('Login with invalid credentials', false, `Unexpected error: ${error.message}`);
      }
    }

    // Test registration validation
    try {
      await authApi.register({ 
        email: 'invalid-email', 
        password: '123', 
        name: '' 
      });
      this.addResult('Registration validation', false, 'Should have failed validation');
    } catch (error: any) {
      this.addResult('Registration validation', true, 'Correctly validates input');
    }

    // Test get profile without authentication
    try {
      authApi.clearAuthData();
      await authApi.getCurrentUser();
      this.addResult('Profile without auth', false, 'Should require authentication');
    } catch (error: any) {
      if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('Invalid credentials')) {
        this.addResult('Profile without auth', true, 'Correctly requires authentication');
      } else {
        this.addResult('Profile without auth', false, `Unexpected error: ${error.message}`);
      }
    }
  }

  private async testTokenManagement(): Promise<void> {
    // Test token storage
    const testToken = 'test-token-123';
    const testUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'volunteer' as const,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    authApi.setAuthData(testToken, testUser);
    
    if (authApi.getAuthToken() === testToken) {
      this.addResult('Token storage', true);
    } else {
      this.addResult('Token storage', false, 'Token not stored correctly');
    }

    if (JSON.stringify(authApi.getStoredUser()) === JSON.stringify(testUser)) {
      this.addResult('User data storage', true);
    } else {
      this.addResult('User data storage', false, 'User data not stored correctly');
    }

    // Test authentication check
    if (authApi.isAuthenticated()) {
      this.addResult('Authentication check', true);
    } else {
      this.addResult('Authentication check', false, 'Should be authenticated');
    }

    // Test auth data clearing
    authApi.clearAuthData();
    
    if (!authApi.isAuthenticated() && !authApi.getAuthToken() && !authApi.getStoredUser()) {
      this.addResult('Auth data clearing', true);
    } else {
      this.addResult('Auth data clearing', false, 'Auth data not cleared completely');
    }
  }

  private addResult(test: string, success: boolean, error?: string): void {
    this.results.push({ test, success, error });
  }

  private displayResults(): void {
    console.log('\n🔐 Authentication Test Results:');
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
      console.log('🎉 All authentication tests passed! Ready for user module integration.');
    } else {
      console.log('⚠️  Some authentication tests failed. Check your implementation.');
    }
  }
}

export const runAuthTests = () => {
  const testSuite = new AuthTestSuite();
  return testSuite.runAllTests();
};

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await runAuthTests();
    } catch (error) {
      console.error('Test run failed:', error);
      process.exit(1);
    }
  })();
}