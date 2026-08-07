import type { ApiResponse, DashboardSummaryDTO } from '@ems/shared';
import { httpClient } from '../../../lib/http';

export async function summary(): Promise<DashboardSummaryDTO> {
  const { data } = await httpClient.get<ApiResponse<DashboardSummaryDTO>>('/dashboard/summary');
  return data.data;
}
