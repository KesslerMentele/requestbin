import {BinRow, PostgresService, RequestRow} from "../types";
import {getPostgresPool } from "../utils/pgConnection";
import pg from "pg";




export const createPgService = ( pool: pg.Pool ): PostgresService => {
    const postgresPool = getPostgresPool();
    const getAllBins = async (): Promise<string[]> => {
        const result = await postgresPool.query<BinRow>('SELECT name FROM bins');
        return result.rows.map<string>(row => row.name);
    };

    const binExists = async (binName: string): Promise<boolean> => {
        const result = await postgresPool.query<{ exists: boolean }>(
          `SELECT EXISTS (SELECT 1
                          FROM bins
                          WHERE name = $1) AS exists`,
          [binName]
        );

        return result.rows[0]?.exists ?? false;
    };

    const assertBinExists = async (binName: string): Promise<void> => {
        const exists = await binExists(binName);
        if (!exists) {
            throw new Error(`Bin ${binName} does not exist`);
        }
    };

    const getAllRequests = async (binName: string): Promise<RequestRow[]> => {
        const result = await postgresPool.query<RequestRow>(
          `select requests.id,
                  bin.name as bin_name,
                  requests.mongodb_id,
                  requests.time_stamp,
                  requests.http_method
           FROM "requests"
                    JOIN bins bin on requests.bin_id = bin.id
           WHERE bin.name = $1`,
          [binName]
        );
        return result.rows;
    }

    const createBin = async (binName: string): Promise<BinRow> => {
        void await assertBinExists(binName);
        const result = await postgresPool.query<BinRow>(
          `INSERT INTO bins (name)
           VALUES ($1) RETURNING name`,
          [binName]
        );
        if (!result.rows[0]) {
            throw new Error(`Bin ${binName} could not be created`)
        }
        return result.rows[0];
    }

    const deleteBin = async (binName: string): Promise<void> => {
        void await assertBinExists(binName);
        void await postgresPool.query(
          `DELETE
           FROM bins
           WHERE name = $1`,
          [binName]
        );
    }

    const deleteRequest = async (id: number, binName: string): Promise<string> => {
        const result = await postgresPool.query<RequestRow>(
          `DELETE
           FROM requests USING bins
           WHERE requests.id = $1
             AND requests.bin_id = bins.id
             AND bins.name = $2 RETURNING requests.mongodb_id`,
          [id, binName]
        );

        if (!result.rows[0] || result.rowCount === 0) {
            throw new Error(`Request ${id} not found in bin "${binName}"`)
        }
        return result.rows[0].mongodb_id;
    }

    const deleteAllRequestsFromBin = async (binName: string): Promise<void> => {
        await postgresPool.query(
          `DELETE
           FROM requests
           WHERE bin_id = (SELECT id FROM bins WHERE name = $1)`,
          [binName]
        );
    }


    const insertRequest = async (binName: string, mongodbID: string, httpMethod: string): Promise<RequestRow> => {
        void await assertBinExists(binName);
        const result = await postgresPool.query<RequestRow>(
          `INSERT INTO requests (bin_id, mongodb_id, http_method)
           VALUES ((SELECT id from bins where name = $1), $2, $3) RETURNING *`,
          [binName, mongodbID, httpMethod]
        );
        if (!result.rows[0]) {
            throw new Error(`Request could not be inserted into bin ${binName}`)
        }
        return result.rows[0];
    }
    return {
        getAllBins,
          getAllRequests,
          createBin,
          deleteBin,
          deleteRequest,
          deleteAllRequestsFromBin,
          insertRequest
    }
}

