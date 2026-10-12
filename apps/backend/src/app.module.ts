import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SharedEvModule } from './modules/shared-ev/shared-ev.module.js';

@Module({
  imports: [
    SharedEvModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

