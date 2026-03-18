import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export type ImportContractsMode = "create" | "update" | "upsert";

export interface IImportContractsAdminPayload {
  contracts: Record<string, unknown>[];
  mode?: ImportContractsMode;
}

export interface IImportContractsAdminResultItem {
  row: number;
  name: string | null;
  success: boolean;
  action?: "created" | "updated";
  contractId?: number;
  message?: string;
}

export interface IImportContractsAdminResponse {
  summary: {
    total: number;
    created: number;
    updated: number;
    failed: number;
  };
  results: IImportContractsAdminResultItem[];
}

const IMPORT_CHUNK_SIZE = 500;

function chunkContracts(contracts: Record<string, unknown>[], chunkSize: number): Record<string, unknown>[][] {
  const chunks: Record<string, unknown>[][] = [];
  for (let index = 0; index < contracts.length; index += chunkSize) {
    chunks.push(contracts.slice(index, index + chunkSize));
  }
  return chunks;
}

export async function importContractsAdmin(payload: IImportContractsAdminPayload) {
  const contracts = Array.isArray(payload?.contracts) ? payload.contracts : [];
  const mode: ImportContractsMode = payload?.mode ?? "create";
  if (!contracts.length) {
    return {
      summary: { total: 0, created: 0, updated: 0, failed: 0 },
      results: [],
    };
  }

  const chunks = chunkContracts(contracts, IMPORT_CHUNK_SIZE);
  const mergedResults: IImportContractsAdminResultItem[] = [];
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalFailed = 0;

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const batch = chunks[chunkIndex];
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/contracts/admin/import`,
      { contracts: batch, mode },
      { headers: { Authorization: `Bearer ${getCookies("authToken")}` } }
    );

    const chunkResult = (response.data?.data ?? response.data) as IImportContractsAdminResponse;
    const rowOffset = chunkIndex * IMPORT_CHUNK_SIZE;

    const normalizedResults = Array.isArray(chunkResult?.results)
      ? chunkResult.results.map((item) => ({
          ...item,
          row: Number(item?.row) + rowOffset,
        }))
      : [];

    mergedResults.push(...normalizedResults);
    totalCreated += Number(chunkResult?.summary?.created ?? 0);
    totalUpdated += Number(chunkResult?.summary?.updated ?? 0);
    totalFailed += Number(chunkResult?.summary?.failed ?? 0);
  }

  return {
    summary: {
      total: contracts.length,
      created: totalCreated,
      updated: totalUpdated,
      failed: totalFailed,
    },
    results: mergedResults,
  } as IImportContractsAdminResponse;
}
