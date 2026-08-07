/**
 * Lightweight "summary" shapes reused across many DTOs (in dropdowns, nested refs,
 * notification payloads, etc.). Full per-entity DTOs are added alongside each feature
 * in later phases; these are the small, widely-shared building blocks.
 */

export interface EmployeeSummary {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  avatarUrl?: string;
}

export interface DepartmentSummary {
  id: string;
  name: string;
}
