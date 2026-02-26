export interface Column {
  name: string;
  description: string;
  synonyms: string | null;
  pii: boolean;
}

export interface Table {
  name: string;
  description: string;
  synonyms: string | null;
  columns: Column[];
}

export interface DataDictionary {
  tables: Record<string, Table>;
  table_count: number;
}

export interface Relationship {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
}

export interface RelationshipsData {
  relationships: Relationship[];
  relationship_count: number;
}

export type HighlightState = 'none' | 'selected' | 'parent' | 'child' | 'dim';

export type TabName = 'dictionary' | 'erd' | 'views' | 'ontology' | 'infrastructure';
