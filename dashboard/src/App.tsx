import Header from './components/Header';
import TabBar from './components/TabBar';
import HomeTab from './components/Home/HomeTab';
import DataDictionaryTab from './components/DataDictionary/DataDictionaryTab';
import TablesTab from './components/Tables/TablesTab';
import ERDTab from './components/ERD/ERDTab';
import ExampleViewsTab from './components/ExampleViews/ExampleViewsTab';
import OntologyTab from './components/Ontology/OntologyTab';
import Footer from './components/Footer';
import GlossaryTab from './components/Glossary/GlossaryTab';
import StatusesTab from './components/Statuses/StatusesTab';
import InfrastructureTab from './components/Infrastructure/InfrastructureTab';
import { useSchemaData } from './hooks/useSchemaData';
import { useHashTab } from './hooks/useHashTab';

export default function App() {
  const [activeTab, setActiveTab] = useHashTab();
  const { dataDictionary, relationships, reverseRelationships, loading, error, exampleViews } = useSchemaData();

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
      <Header version={dataDictionary?.version} released={dataDictionary?.released} />
      <TabBar activeTab={activeTab} />
      <div style={{ display: activeTab === 'home' ? 'block' : 'none' }}>
        {dataDictionary && (
          <HomeTab dataDictionary={dataDictionary} relationships={relationships} onNavigate={setActiveTab} />
        )}
        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#95a5a6' }}>Loading...</div>}
      </div>
      <div style={{ display: activeTab === 'dictionary' ? 'block' : 'none' }}>
        {dataDictionary && (
          <DataDictionaryTab
            dataDictionary={dataDictionary}
            relationships={relationships}
            reverseRelationships={reverseRelationships}
          />
        )}
      </div>
      <div style={{ display: activeTab === 'tables' ? 'block' : 'none' }}>
        {dataDictionary && (
          <TablesTab
            dataDictionary={dataDictionary}
            relationships={relationships}
            reverseRelationships={reverseRelationships}
          />
        )}
      </div>
      {activeTab === 'erd' && dataDictionary && (
        <ERDTab
          dataDictionary={dataDictionary}
          relationships={relationships}
        />
      )}
      <div style={{ display: activeTab === 'views' ? 'block' : 'none' }}>
        <ExampleViewsTab views={exampleViews} />
      </div>
      <div style={{ display: activeTab === 'ontology' ? 'block' : 'none' }}>
        <OntologyTab />
      </div>
      <div style={{ display: activeTab === 'glossary' ? 'block' : 'none' }}>
        <GlossaryTab />
      </div>
      <div style={{ display: activeTab === 'statuses' ? 'block' : 'none' }}>
        <StatusesTab />
      </div>
      {activeTab === 'infrastructure' && (
        <InfrastructureTab />
      )}
      <Footer />
    </>
  );
}
