import type { SQLiteDatabase } from 'expo-sqlite';

export interface Migration {
  id: number;
  name: string;
  up: (db: SQLiteDatabase) => void;
}
