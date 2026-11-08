import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { SimulationService } from './simulation.service.js';

@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Get('recommendations')
  findAllRecommendations() {
    return this.simulationService.findAllRecommendations();
  }

  @Get('recommendations/:id')
  findRecommendationById(@Param('id') id: string) {
    return this.simulationService.findRecommendationById(id);
  }

  @Post('recommendations/:id/validate')
  validateRecommendation(
    @Param('id') id: string,
    @Body('simulateMismatch') simulateMismatch?: boolean,
  ) {
    return this.simulationService.validateRecommendation(id, Boolean(simulateMismatch));
  }

  @Post('recommendations/:id/adjust')
  adjustParameter(
    @Param('id') id: string,
    @Body('paramId') paramId: string,
    @Body('newValue') newValue: number,
  ) {
    return this.simulationService.adjustParameter(id, paramId, Number(newValue));
  }

  @Post('recommendations/:id/switch-hub')
  switchAlternativeHub(
    @Param('id') id: string,
    @Body('newHubId') newHubId: string,
  ) {
    return this.simulationService.switchAlternativeHub(id, newHubId);
  }

  @Post('recommendations/:id/approve')
  approveRecommendation(
    @Param('id') id: string,
    @Body('operatorNotes') operatorNotes?: string,
  ) {
    return this.simulationService.approveRecommendation(id, operatorNotes);
  }

  @Post('recommendations/:id/reject')
  rejectRecommendation(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.simulationService.rejectRecommendation(id, reason);
  }

  @Post('recommendations/:id/archive')
  archiveRecommendation(@Param('id') id: string) {
    return this.simulationService.archiveRecommendation(id);
  }

  @Get('coordination-actions')
  findAllCoordinationActions() {
    return this.simulationService.findAllCoordinationActions();
  }
}

