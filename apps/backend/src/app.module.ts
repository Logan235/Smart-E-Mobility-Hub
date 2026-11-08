import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SharedEvModule } from './modules/shared-ev/shared-ev.module.js';
import { SimulationModule } from './modules/simulation/simulation.module.js';
import { CoordinationModule } from './modules/coordination/coordination.module.js';

@Module({
  imports: [
    SharedEvModule,
    SimulationModule,
    CoordinationModule,
  ],
import { MonitoringModule } from './modules/monitoring/monitoring.module.js';

@Module({
  imports: [SharedEvModule, MonitoringModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
