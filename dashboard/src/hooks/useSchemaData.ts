import { useState, useEffect, useMemo } from 'react';
import type { DataDictionary, Relationship } from '../types';

const BASE = import.meta.env.BASE_URL;

export function useSchemaData() {
  const [dataDictionary, setDataDictionary] = useState<DataDictionary | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}data/data-dictionary.json`).then(r => r.json()),
      fetch(`${BASE}data/relationships.json`).then(r => r.json()),
    ])
      .then(([dd, rel]) => {
        setDataDictionary(dd);
        setRelationships(rel.relationships);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const reverseRelationships = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const rel of relationships) {
      if (rel.from_table !== rel.to_table) {
        if (!map[rel.to_table]) map[rel.to_table] = [];
        if (!map[rel.to_table].includes(rel.from_table)) {
          map[rel.to_table].push(rel.from_table);
        }
      }
    }
    for (const table in map) {
      map[table].sort();
    }
    return map;
  }, [relationships]);

  return { dataDictionary, relationships, reverseRelationships, loading, error };
}
