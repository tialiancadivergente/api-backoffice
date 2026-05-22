import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VendasModule } from './vendas/vendas.module';
import { DatabricksModule } from './databricks/databricks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    VendasModule,
    DatabricksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
