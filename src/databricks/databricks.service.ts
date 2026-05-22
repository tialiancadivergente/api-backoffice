import { Injectable, Logger } from '@nestjs/common';
import { DBSQLClient } from '@databricks/sql';

@Injectable()
export class DatabricksService {
  private readonly logger = new Logger(DatabricksService.name);
  private client: DBSQLClient;

  constructor() {
    this.client = new DBSQLClient();
  }

  private getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value || !value.trim()) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value.trim();
  }

  private withTimeout<T>(
    promise: Promise<T>,
    stage: string,
    timeoutMs = Number(process.env.DATABRICKS_TIMEOUT_MS ?? 20000),
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Databricks timeout while ${stage} after ${timeoutMs}ms`,
          ),
        );
      }, timeoutMs);

      promise
        .then((result) => resolve(result))
        .catch((error) => reject(error))
        .finally(() => clearTimeout(timer));
    });
  }

  async openSession() {
    const host = this.getRequiredEnv('DATABRICKS_HOST');
    const path = this.getRequiredEnv('DATABRICKS_HTTP_PATH');
    const token = this.getRequiredEnv('DATABRICKS_TOKEN');

    this.logger.log('DBSQLClient: connecting');
    await this.withTimeout(
      this.client.connect({
        host,
        path,
        token,
      }),
      'connecting',
    );

    this.logger.log('DBSQLClient: opening session');

    return this.withTimeout(
      this.client.openSession(),
      'opening session',
    );
  }

  async executeQuery<T = any>(
    query: string,
  ): Promise<T[]> {
    const session = await this.openSession();
    let operation: Awaited<ReturnType<typeof session.executeStatement>> | null =
      null;

    try {
      this.logger.log('DBSQLClient: executing statement');
      operation = await this.withTimeout(
        session.executeStatement(query),
        'executing statement',
      );

      this.logger.log('DBSQLClient: fetching all rows');
      const result = await this.withTimeout(
        operation.fetchAll(),
        'fetching all rows',
      );

      return result as T[];
    } catch (error) {
      this.logger.error(
        `Databricks query failed: ${(error as Error).message}`,
      );
      throw error;
    } finally {
      if (operation) {
        await operation
          .close()
          .catch((err: Error) =>
            this.logger.warn(
              `Failed to close operation: ${err.message}`,
            ),
          );
      }

      await session.close();
    }
  }

  async close() {
    await this.client.close();
  }
}
