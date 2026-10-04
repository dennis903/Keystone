import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        OBSERVER_APP_KEY: Joi.string().required(),
        OBSERVER_APP_SECRET: Joi.string().required(),
        OBSERVER_APP_SERVICE_ID: Joi.string().required(),
      }),
    }),
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        appKey: configService.get<string>('OBSERVER_APP_KEY')!,
        appSecret: configService.get<string>('OBSERVER_APP_SECRET')!,
        serviceId: configService.get<string>('OBSERVER_APP_SERVICE_ID')!,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
