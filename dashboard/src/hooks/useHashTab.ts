import { useEffect, useState } from 'react';
import type { TabName } from '../types';

// Each tab's link, taken from its label: ui-insight.github.io/AI4RA-UDM/#statuses.
export const TAB_SLUGS: Record<TabName, string> = {
  home: 'home',
  glossary: 'glossary',
  statuses: 'statuses',
  dictionary: 'data-dictionary',
  tables: 'explorer',
  erd: 'erd',
  views: 'example-views',
  ontology: 'design',
  infrastructure: 'infrastructure',
};

function tabFromHash(): TabName {
  const slug = decodeURIComponent(window.location.hash.slice(1)).toLowerCase();
  const match = (Object.keys(TAB_SLUGS) as TabName[]).find(
    (tab) => TAB_SLUGS[tab] === slug || tab === slug,
  );
  return match ?? 'home';
}

// The active tab follows the URL hash, so a tab can be linked to and the back button works.
export function useHashTab(): [TabName, (tab: TabName) => void] {
  const [tab, setTab] = useState<TabName>(tabFromHash);

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: TabName) => {
    window.location.hash = TAB_SLUGS[next];
  };

  return [tab, navigate];
}
