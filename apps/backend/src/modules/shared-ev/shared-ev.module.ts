import { Module } from '@nestjs/common';
import { SharedEvService } from './shared-ev.service.js';
import { SharedEvController } from './shared-ev.controller.js';

@Module({
  controllers: [SharedEvController],
  providers: [SharedEvService],
})
export class SharedEvModule {}
