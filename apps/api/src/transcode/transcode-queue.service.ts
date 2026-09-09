import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import type { TranscodeJobData } from './transcode.processor';

export const TRANSCODE_QUEUE_NAME = 'video-transcode';

@Injectable()
export class TranscodeQueueService implements OnModuleDestroy {
  private readonly connection = new IORedis(process.env.REDIS_URL as string, {
    maxRetriesPerRequest: null,
  });
  private readonly queue = new Queue<TranscodeJobData>(TRANSCODE_QUEUE_NAME, {
    connection: this.connection,
  });

  enqueue(data: TranscodeJobData) {
    return this.queue.add('transcode', data, {
      removeOnComplete: true,
      removeOnFail: 50,
    });
  }

  async onModuleDestroy() {
    await this.queue.close();
    this.connection.disconnect();
  }
}
