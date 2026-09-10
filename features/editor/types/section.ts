/**
 * [LOCK 01] Editor Section Data Contract for OPS Blueprint V1
 * Directly mapped to Supabase 'sections' table
 */
export interface EditorSection {
  id: string;
  name: string;
  position: number;
  isCollapsed?: boolean;
}

/**
 * 범용 UUID 생성 유틸리티 (Database UUID 호환)
 */
export function generateSectionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `section-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const DEFAULT_INITIAL_SECTIONS: EditorSection[] = [
  {
    id: 'section-1',
    name: '1. 입사 및 기초 등록',
    position: 0,
    isCollapsed: false,
  },
];
