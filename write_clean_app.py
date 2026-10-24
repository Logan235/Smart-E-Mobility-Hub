script_content = '''import React from "react";
import { MainLayout } from "./components/layout/MainLayout";
import { Module1SharedEV } from "./modules/module1-shared-ev/Module1View";
import Module2 from "./modules/module2-parking/Module2View";
import { Module2NetworkDashboard } from "./modules/module3-monitoring/Module3View";
import { Module4ResourceRedistribution } from "./modules/module4-redist/Module4View";
import { IncidentSimulationCenter } from "./components/incident-simulation/IncidentSimulationCenter";

export function App() {
  const [activeModule, setActiveModule] = React.useState<number>(1);

  const renderModuleContent = () => {
    switch (activeModule) {
      case 1:
        return <Module1SharedEV />;
      case 2:
        return <Module2 />;
      case 3:
        return <Module2NetworkDashboard />;
      case 4:
        return <Module4ResourceRedistribution />;
      case 5:
        return <IncidentSimulationCenter />;
      default:
        return <Module1SharedEV />;
    }
  };

  return (
    <MainLayout activeModule={activeModule} setActiveModule={setActiveModule}>
      {renderModuleContent()}
    </MainLayout>
  );
}

export default App;
'''

with open("Smart-E-Mobility-Hub/apps/frontend/src/App.tsx", "w", encoding="utf-8") as f:
    f.write(script_content)
print("App.tsx written cleanly")
