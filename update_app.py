content = """import React from "react";
import { MainLayout } from "./components/layout/MainLayout";
import { Module1SharedEV } from "./modules/module1-shared-ev/Module1View";
import { Module2Parking } from "./modules/module2-parking/Module2View";
import { Module3Monitoring } from "./modules/module3-monitoring/Module3View";
import { Module4Redist } from "./modules/module4-redist/Module4View";
import { IncidentSimulationCenter } from "./components/incident-simulation/IncidentSimulationCenter";

export function App() {
  const [activeModule, setActiveModule] = React.useState<number>(1);

  const renderModuleContent = () => {
    switch (activeModule) {
      case 1:
        return <Module1SharedEV />;
      case 2:
        return <Module2Parking />;
      case 3:
        return <Module3Monitoring />;
      case 4:
        return <Module4Redist />;
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
"""

with open("Smart-E-Mobility-Hub/apps/frontend/src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Successfully updated App.tsx")
