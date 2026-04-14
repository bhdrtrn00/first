// ─── Executive ───────────────────────────────────────────────────────────────
export { ceoAgent } from './executive/ceo.js';
export { cfoAgent } from './executive/cfo.js';
export { cooAgent } from './executive/coo.js';

// ─── Operations ──────────────────────────────────────────────────────────────
export { airFreightManagerAgent } from './operations/airFreightManager.js';
export { oceanFreightManagerAgent } from './operations/oceanFreightManager.js';
export { groundTransportManagerAgent } from './operations/groundTransportManager.js';
export { dispatchCoordinatorAgent } from './operations/dispatchCoordinator.js';

// ─── Customs & Compliance ─────────────────────────────────────────────────────
export { customsManagerAgent } from './customs/customsManager.js';
export { complianceOfficerAgent } from './customs/complianceOfficer.js';
export { tradeSpecialistAgent } from './customs/tradeSpecialist.js';

// ─── Sales & Business Development ────────────────────────────────────────────
export { salesDirectorAgent } from './sales/salesDirector.js';
export { businessDevelopmentAgent } from './sales/businessDevelopment.js';
export { accountManagerAgent } from './sales/accountManager.js';

// ─── Customer Service ─────────────────────────────────────────────────────────
export { customerServiceManagerAgent } from './customerService/customerServiceManager.js';
export { trackingSpecialistAgent } from './customerService/trackingSpecialist.js';

// ─── Documentation ────────────────────────────────────────────────────────────
export { documentationManagerAgent } from './documentation/documentationManager.js';
export { billOfLadingSpecialistAgent } from './documentation/billOfLadingSpecialist.js';

// ─── Warehouse & Logistics ────────────────────────────────────────────────────
export { warehouseManagerAgent } from './warehouse/warehouseManager.js';
export { inventorySpecialistAgent } from './warehouse/inventorySpecialist.js';

// ─── Technology & Data ────────────────────────────────────────────────────────
export { itManagerAgent } from './technology/itManager.js';
export { dataAnalystAgent } from './technology/dataAnalyst.js';

// ─── Risk & Insurance ─────────────────────────────────────────────────────────
export { riskManagerAgent } from './risk/riskManager.js';
export { insuranceSpecialistAgent } from './risk/insuranceSpecialist.js';

// ─── Registry builder ────────────────────────────────────────────────────────

import type { AgentRegistry } from '../types.js';

import { ceoAgent } from './executive/ceo.js';
import { cfoAgent } from './executive/cfo.js';
import { cooAgent } from './executive/coo.js';
import { airFreightManagerAgent } from './operations/airFreightManager.js';
import { oceanFreightManagerAgent } from './operations/oceanFreightManager.js';
import { groundTransportManagerAgent } from './operations/groundTransportManager.js';
import { dispatchCoordinatorAgent } from './operations/dispatchCoordinator.js';
import { customsManagerAgent } from './customs/customsManager.js';
import { complianceOfficerAgent } from './customs/complianceOfficer.js';
import { tradeSpecialistAgent } from './customs/tradeSpecialist.js';
import { salesDirectorAgent } from './sales/salesDirector.js';
import { businessDevelopmentAgent } from './sales/businessDevelopment.js';
import { accountManagerAgent } from './sales/accountManager.js';
import { customerServiceManagerAgent } from './customerService/customerServiceManager.js';
import { trackingSpecialistAgent } from './customerService/trackingSpecialist.js';
import { documentationManagerAgent } from './documentation/documentationManager.js';
import { billOfLadingSpecialistAgent } from './documentation/billOfLadingSpecialist.js';
import { warehouseManagerAgent } from './warehouse/warehouseManager.js';
import { inventorySpecialistAgent } from './warehouse/inventorySpecialist.js';
import { itManagerAgent } from './technology/itManager.js';
import { dataAnalystAgent } from './technology/dataAnalyst.js';
import { riskManagerAgent } from './risk/riskManager.js';
import { insuranceSpecialistAgent } from './risk/insuranceSpecialist.js';

/**
 * Builds and returns the complete agent registry with all 24 agents.
 * The registry is a Map<AgentId, AgentConfig> used by the Orchestrator
 * to look up agent configurations by ID.
 */
export function buildAgentRegistry(): AgentRegistry {
  const registry: AgentRegistry = new Map();

  const allAgents = [
    // Executive (3)
    ceoAgent,
    cfoAgent,
    cooAgent,
    // Operations (4)
    airFreightManagerAgent,
    oceanFreightManagerAgent,
    groundTransportManagerAgent,
    dispatchCoordinatorAgent,
    // Customs & Compliance (3)
    customsManagerAgent,
    complianceOfficerAgent,
    tradeSpecialistAgent,
    // Sales & Business Development (3)
    salesDirectorAgent,
    businessDevelopmentAgent,
    accountManagerAgent,
    // Customer Service (2)
    customerServiceManagerAgent,
    trackingSpecialistAgent,
    // Documentation (2)
    documentationManagerAgent,
    billOfLadingSpecialistAgent,
    // Warehouse & Logistics (2)
    warehouseManagerAgent,
    inventorySpecialistAgent,
    // Technology & Data (2)
    itManagerAgent,
    dataAnalystAgent,
    // Risk & Insurance (2)
    riskManagerAgent,
    insuranceSpecialistAgent,
  ];

  for (const agent of allAgents) {
    registry.set(agent.id, agent);
  }

  return registry;
}
