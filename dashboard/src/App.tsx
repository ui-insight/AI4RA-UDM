import { useState } from 'react';
import Header from './components/Header';
import TabBar from './components/TabBar';
import DataDictionaryTab from './components/DataDictionary/DataDictionaryTab';
import ERDTab from './components/ERD/ERDTab';
import ExampleViewsTab from './components/ExampleViews/ExampleViewsTab';
import OntologyTab from './components/Ontology/OntologyTab';
import InfrastructureTab from './components/Infrastructure/InfrastructureTab';
import { useSchemaData } from './hooks/useSchemaData';
import type { TabName } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('dictionary');
  const { dataDictionary, relationships, reverseRelationships, loading, error } = useSchemaData();

  if (error) {
    return (
      <>
        <Header />
        <div style={{ padding: '3rem', textAlign: 'center', color: '#e74c3c' }}>
          Error loading data: {error}
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{ display: activeTab === 'dictionary' ? 'block' : 'none' }}>
        {dataDictionary && (
          <DataDictionaryTab
            dataDictionary={dataDictionary}
            relationships={relationships}
            reverseRelationships={reverseRelationships}
          />
        )}
        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#95a5a6' }}>Loading...</div>}
      </div>
      {activeTab === 'erd' && dataDictionary && (
        <ERDTab
          dataDictionary={dataDictionary}
          relationships={relationships}
        />
      )}
      <div style={{ display: activeTab === 'views' ? 'block' : 'none' }}>
        <ExampleViewsTab />
      </div>
      <div style={{ display: activeTab === 'ontology' ? 'block' : 'none' }}>
        <OntologyTab />
      </div>
      {activeTab === 'infrastructure' && (
        <InfrastructureTab />
      )}
    </>
  );
}
