import { Module } from '@nestjs/common';
import { VendasController } from './vendas.controller';
import { VendasService } from './vendas.service';
import { DatabricksModule } from 'src/databricks/databricks.module';

@Module({
  imports: [DatabricksModule],
  controllers: [VendasController],
  providers: [VendasService]
})
export class VendasModule {}
