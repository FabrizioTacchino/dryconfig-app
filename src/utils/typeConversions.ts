
import { WallType, DatabaseWallType } from '@/types';

/**
 * Maps a WallType from the application to a DatabaseWallType for database operations
 * This function ensures that we use compatible values with the database schema
 */
export const mapWallTypeToDatabase = (wallType: WallType | string): DatabaseWallType => {
  // If the wall type is one of the database types, use it as-is
  if (['plating', 'counterwall', 'single', 'double', 'ceiling'].includes(wallType)) {
    return wallType as DatabaseWallType;
  }
  
  // If not, map legacy types to their closest database equivalent
  switch (wallType) {
    case 'internal':
    case 'external':
      return 'single';
    case 'roof':
      return 'ceiling';
    case 'foundation':
      return 'single';
    default:
      return 'single'; // Default fallback
  }
};

/**
 * Maps a DatabaseWallType from the database to a WallType for the application
 * This function ensures consistent representation in the UI
 */
export const mapDatabaseToWallType = (dbType: DatabaseWallType): WallType => {
  return dbType as WallType;
};
