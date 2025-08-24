const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { GoalsService } = require('./dist/goals/goals.service');

async function triggerWeeklyProcessing() {
  try {
    console.log('🚀 Starting application...');
    const app = await NestFactory.create(AppModule);
    
    console.log('Triggering weekly goal processing...');
    const goalsService = app.get(GoalsService);
    const result = await goalsService.processWeeklyGoals();
    
    console.log('Weekly processing completed:', result);
    
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during weekly processing:', error);
    process.exit(1);
  }
}

triggerWeeklyProcessing();