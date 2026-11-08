import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SimulationService } from './simulation.service.js';

describe('SimulationService - UC-SIM-02: Review and Apply Simulation Recommendations', () => {
  let service: SimulationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SimulationService],
    }).compile();

    service = module.get<SimulationService>(SimulationService);
  });

  describe('Main Flow: Steps 1-3 - Discover & Review Recommendations', () => {
    it('should return initial list of simulation recommendations with expected impact data', () => {
      const recommendations = service.findAllRecommendations();
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThanOrEqual(3);

      const rec1 = recommendations.find((r) => r.id === 'REC-01');
      expect(rec1).toBeDefined();
      expect(rec1?.code).toBe('REC-SIM-01');
      expect(rec1?.type).toBe('REROUTE');
      expect(rec1?.status).toBe('PENDING_REVIEW');
      expect(rec1?.approved).toBe(false);
      expect(rec1?.expectedImpact.capacityGainPercent).toBe(18);
      expect(rec1?.affectedResources).toContain('PORT-METRO-01');
    });

    it('should retrieve a specific recommendation by its ID', () => {
      const rec = service.findRecommendationById('REC-02');
      expect(rec).toBeDefined();
      expect(rec.id).toBe('REC-02');
      expect(rec.type).toBe('RESCHEDULE_CHARGING');
    });

    it('should throw NotFoundException when recommendation ID does not exist', () => {
      expect(() => service.findRecommendationById('NON-EXISTENT')).toThrow(NotFoundException);
    });
  });

  describe('Main Flow: Step 4 & Exception Flow E2 - Operational State Validation', () => {
    it('should validate recommendation successfully when operational state matches constraints', () => {
      const validated = service.validateRecommendation('REC-01', false);
      expect(validated.feasibility.isFeasible).toBe(true);
      expect(validated.feasibility.stateMatch).toBe(true);
      expect(validated.feasibility.constraintsChecked.length).toBeGreaterThan(0);
      expect(validated.feasibility.warningMessage).toBeUndefined();
    });

    it('should flag operational state mismatch and mark unfeasible when live state changes (Exception E2)', () => {
      const invalidated = service.validateRecommendation('REC-01', true);
      expect(invalidated.feasibility.isFeasible).toBe(false);
      expect(invalidated.feasibility.stateMatch).toBe(false);
      expect(invalidated.feasibility.warningMessage).toContain('Exception E2');
      expect(invalidated.feasibility.constraintsChecked.some((c) => !c.passed)).toBe(true);
    });
  });

  describe('Alternate Flow A1: Adjust Recommendation Parameters', () => {
    it('should dynamically recalculate expected impact and update audit trail when reroute ratio changes', () => {
      const updated = service.adjustParameter('REC-01', 'reroute_ratio', 60);

      const param = updated.adjustableParams.find((p) => p.id === 'reroute_ratio');
      expect(param?.currentValue).toBe(60);
      // Math.round(60 * 0.45) = 27
      expect(updated.expectedImpact.capacityGainPercent).toBe(27);
      // Number((60 * 0.22).toFixed(1)) = 13.2
      expect(updated.expectedImpact.waitReductionMinutes).toBe(13.2);
      expect(updated.impactGain).toBe('+27% Serving Capacity');

      // Check audit trail
      expect(updated.auditTrail[0].decision).toBe('ADJUSTED');
      expect(updated.auditTrail[0].summary).toContain('Diverted Passenger Percentage');
    });

    it('should recalculate grid load when defer hours parameter is adjusted', () => {
      const updated = service.adjustParameter('REC-02', 'defer_hours', 4);

      const param = updated.adjustableParams.find((p) => p.id === 'defer_hours');
      expect(param?.currentValue).toBe(4);
      // Math.round(10 + 4 * 1.5) = 16
      expect(updated.expectedImpact.capacityGainPercent).toBe(16);
      expect(updated.impactGain).toBe('Frees 60kW Grid Load');
    });

    it('should throw BadRequestException if parameter ID is not found', () => {
      expect(() => service.adjustParameter('REC-01', 'invalid_param', 50)).toThrow(BadRequestException);
    });
  });

  describe('Alternate Flow A2: Alternative Hub Accommodation', () => {
    it('should allow switching to an eligible alternative hub with available capacity', () => {
      const switched = service.switchAlternativeHub('REC-01', 'HUB-CAMPUS');
      expect(switched.targetHubName).toContain('Campus Center Hub');
      expect(switched.auditTrail[0].decision).toBe('HUB_SWITCHED');
      expect(switched.auditTrail[0].summary).toContain('Campus Center Hub');
    });

    it('should reject switching to an overloaded or ineligible alternative hub', () => {
      expect(() => service.switchAlternativeHub('REC-01', 'HUB-SERVICE')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unknown hub ID', () => {
      expect(() => service.switchAlternativeHub('REC-01', 'HUB-NON-EXISTENT')).toThrow(BadRequestException);
    });
  });

  describe('Main Flow: Steps 5-8 - Approve & Dispatch Operational Coordination Action', () => {
    it('should approve recommendation, create operational action, and record live network dispatch (BR-12)', () => {
      const operatorNote = 'Approved during evening peak commuting window';
      const approved = service.approveRecommendation('REC-01', operatorNote);

      expect(approved.status).toBe('APPROVED');
      expect(approved.approved).toBe(true);
      expect(approved.approvedAt).toBeDefined();
      expect(approved.coordinationAction).toBeDefined();

      const action = approved.coordinationAction!;
      expect(action.actionId).toMatch(/^ACT-COORD-/);
      expect(action.status).toBe('APPLIED');
      expect(action.liveNetworkApplied).toBe(true);
      expect(action.operatorNotes).toBe(operatorNote);
      expect(action.affectedResources).toEqual(approved.affectedResources);

      // Audit trail updated
      expect(approved.auditTrail[0].decision).toBe('APPROVED');

      // Action appears in active coordination list
      const actions = service.findAllCoordinationActions();
      expect(actions.some((a) => a.actionId === action.actionId)).toBe(true);
    });

    it('should block approval and throw BadRequestException if operational state is unfeasible (Exception E2)', () => {
      // Invalidate state first
      service.validateRecommendation('REC-03', true);

      expect(() => service.approveRecommendation('REC-03')).toThrow(BadRequestException);
      const rec = service.findRecommendationById('REC-03');
      expect(rec.approved).toBe(false);
      expect(rec.status).toBe('PENDING_REVIEW');
    });
  });

  describe('Alternate Flow A4: Reject Recommendation', () => {
    it('should reject recommendation, keep live network unchanged, and record operator decision', () => {
      const rejected = service.rejectRecommendation('REC-02', 'Demand has normalized naturally');
      expect(rejected.status).toBe('REJECTED');
      expect(rejected.approved).toBe(false);
      expect(rejected.auditTrail[0].decision).toBe('REJECTED');
      expect(rejected.auditTrail[0].summary).toContain('Demand has normalized naturally');
      expect(rejected.coordinationAction).toBeUndefined();
    });
  });

  describe('Alternate Flow A3: Archive Scenario Only', () => {
    it('should archive recommendation without creating live network actions', () => {
      const archived = service.archiveRecommendation('REC-03');
      expect(archived.status).toBe('ARCHIVED');
      expect(archived.auditTrail[0].decision).toBe('ARCHIVED');
      expect(archived.auditTrail[0].summary).toContain('No operational action dispatched (A3)');
      expect(archived.coordinationAction).toBeUndefined();
    });
  });
});

