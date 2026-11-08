import { Test, type TestingModule } from '@nestjs/testing';
import { SimulationController } from './simulation.controller.js';
import { SimulationService } from './simulation.service.js';

describe('SimulationController - UC-SIM-02 Endpoints', () => {
  let controller: SimulationController;
  let service: SimulationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimulationController],
      providers: [SimulationService],
    }).compile();

    controller = module.get<SimulationController>(SimulationController);
    service = module.get<SimulationService>(SimulationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('GET /recommendations should return all simulation recommendations', () => {
    const res = controller.findAllRecommendations();
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });

  it('GET /recommendations/:id should return single recommendation', () => {
    const res = controller.findRecommendationById('REC-01');
    expect(res.id).toBe('REC-01');
  });

  it('POST /recommendations/:id/validate should validate state', () => {
    const res = controller.validateRecommendation('REC-01', false);
    expect(res.feasibility.isFeasible).toBe(true);
  });

  it('POST /recommendations/:id/adjust should handle parameter update', () => {
    const res = controller.adjustParameter('REC-01', 'reroute_ratio', 50);
    expect(res.expectedImpact.capacityGainPercent).toBe(23); // Math.round(50 * 0.45) = 23
  });

  it('POST /recommendations/:id/switch-hub should switch alternative hub', () => {
    const res = controller.switchAlternativeHub('REC-01', 'HUB-DORM');
    expect(res.targetHubName).toContain('Dormitory Area B Hub');
  });

  it('POST /recommendations/:id/approve should approve recommendation', () => {
    const res = controller.approveRecommendation('REC-01', 'Approved via controller');
    expect(res.approved).toBe(true);
    expect(res.status).toBe('APPROVED');
  });

  it('POST /recommendations/:id/reject should reject recommendation', () => {
    const res = controller.rejectRecommendation('REC-02', 'Rejected via controller');
    expect(res.status).toBe('REJECTED');
  });

  it('POST /recommendations/:id/archive should archive recommendation', () => {
    const res = controller.archiveRecommendation('REC-03');
    expect(res.status).toBe('ARCHIVED');
  });

  it('GET /coordination-actions should return dispatched actions', () => {
    controller.approveRecommendation('REC-01');
    const actions = controller.findAllCoordinationActions();
    expect(actions.length).toBeGreaterThan(0);
  });
});

