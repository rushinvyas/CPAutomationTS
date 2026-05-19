export interface ScenarioContext {
  portal: string;
  candidateUsername?: string;
  candidateId?: string;
  loginUsername?: string;
  loginPassword?: string;
  email?: string;
  selectedLinkName?: string;
}

export function createScenarioContext(): ScenarioContext {
  return {
    portal: "HOLT"
  };
}
