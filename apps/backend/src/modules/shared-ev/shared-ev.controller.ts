import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { SharedEvService } from './shared-ev.service.js';

@Controller('shared-ev')
export class SharedEvController {
  constructor(private readonly sharedEvService: SharedEvService) {}

  @Get()
  findAll() {
    return this.sharedEvService.findAll();
  }

  @Get('hub/:hubId')
  findByHub(@Param('hubId') hubId: string) {
    return this.sharedEvService.findByHub(hubId);
  }

  @Post(':id/reserve')
  reserve(@Param('id') id: string, @Body('studentId') studentId: string) {
    return this.sharedEvService.reserveEv(id, studentId || 'STU-DEFAULT');
  }
}

