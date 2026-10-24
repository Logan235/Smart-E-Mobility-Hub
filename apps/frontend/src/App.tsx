import { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { Module1SharedEV } from './modules/module1-shared-ev/ModuleView';
import Module2 from './modules/module2-parking/ModuleView';
import Module3 from './modules/module3-monitoring/ModuleView';
import { Module4ResourceRedistribution } from './modules/module4-redist/ModuleView';
import { Module5View } from './modules/module5-simulation/ModuleView';

export function Apptest() {
  const [activeModule, setActiveModule] = useState<number>(1);

  const renderContent = () => {
    switch (activeModule) {
      case 1: return <Module1SharedEV />;
      case 2: return <Module2 />;
      case 3: return <Module3 />;
      case 4: return <Module4ResourceRedistribution />;
      case 5: return <Module5View />;
      default: return <Module1SharedEV />;
    }
  };

  return (
    <MainLayout activeModule={activeModule} setActiveModule={setActiveModule}>
      {renderContent()}
    </MainLayout>
  );
}

export default Apptest;
