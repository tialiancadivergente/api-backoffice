import { Injectable } from '@nestjs/common';
import { DatabricksService } from '../databricks/databricks.service';

@Injectable()
export class VendasService {
  constructor(
    private readonly databricksService: DatabricksService,
  ) {}

  async listar(limit = 100) {
    return this.databricksService.executeQuery(`
      SELECT *
      FROM data_lake_imperio.default.vw_pedido_griddlt
      LIMIT ${limit}
    `);
  }
}