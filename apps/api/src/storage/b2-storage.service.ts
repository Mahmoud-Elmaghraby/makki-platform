import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { pipeline } from 'stream/promises';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

const DELETE_BATCH_SIZE = 1000;
const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024; // 5GB — كفاية لأي فيديو درس

// منقول من new-mistak (C:\Projects\new-mistak) بتصريح صريح من صاحب المشروع.
// راجع docs/reuse-plan.md لتفاصيل القرار.
@Injectable()
export class B2StorageService {
  private readonly bucket = process.env.B2_BUCKET_NAME as string;

  private _uploadClient?: S3Client;
  private _deliveryClient?: S3Client;

  // Lazily constructed: B2 is only needed by the video-lesson feature, so a
  // missing/incomplete B2_* config (e.g. before the client has set up their
  // bucket) must not crash the whole app at boot — every other feature
  // (auth, courses metadata, ...) should keep working regardless.

  // Uploads always go straight to B2 (no CDN benefit for one-time writes).
  private get uploadClient(): S3Client {
    if (!this._uploadClient) {
      this._uploadClient = new S3Client({
        region: process.env.B2_REGION,
        endpoint: process.env.B2_ENDPOINT,
        forcePathStyle: true,
        // من الإصدارات الحديثة لـ AWS SDK v3: بيضيف هيدرز checksum
        // (x-amz-sdk-checksum-algorithm...) تلقائيًا لكل PUT، حتى مع
        // مزوّدين غير AWS زي B2 — ده بيكسّر رفع الفيديو المباشر من المتصفح
        // (presigned PUT) لأن الهيدرز دي بتضطر المتصفح يعمل CORS preflight
        // والـ bucket مش متظبط يسمح بيها. تعطيله هو الحل الموثّق من AWS نفسها
        // للتوافق مع S3-compatible storage.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        credentials: {
          accessKeyId: process.env.B2_APPLICATION_KEY_ID as string,
          secretAccessKey: process.env.B2_APPLICATION_KEY as string,
        },
      });
    }
    return this._uploadClient;
  }

  // Reads/deliveries route through the CDN base URL when configured
  // (free egress via Backblaze's Bandwidth Alliance with Cloudflare),
  // falling back to hitting B2 directly otherwise.
  private get deliveryClient(): S3Client {
    if (!this._deliveryClient) {
      this._deliveryClient = new S3Client({
        region: process.env.B2_REGION,
        endpoint: process.env.B2_CDN_BASE_URL || process.env.B2_ENDPOINT,
        forcePathStyle: true,
        requestChecksumCalculation: 'WHEN_REQUIRED',
        credentials: {
          accessKeyId: process.env.B2_APPLICATION_KEY_ID as string,
          secretAccessKey: process.env.B2_APPLICATION_KEY as string,
        },
      });
    }
    return this._deliveryClient;
  }

  getPresignedPutUrl(key: string, expiresInSeconds = 60 * 60) {
    return getSignedUrl(
      this.uploadClient,
      new PutObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  /**
   * بديل presigned **POST** بدل presigned PUT للرفع المباشر من المتصفح لـ B2.
   * السبب: طلب PUT من المتصفح بيفرض preflight (OPTIONS) دايمًا، وB2 (على
   * عكس Amazon S3 الأصلي) بيرفض طلب الـ OPTIONS ده بـ 403 قبل حتى ما يوصل
   * لمرحلة تقييم قاعدة الـ CORS بتاعة الـ bucket — قيد موثّق في B2 مفيش منه
   * حل من ناحية إعدادات الـ bucket. رفع POST بصيغة FormData بيتصنّف "طلب
   * بسيط" عند المتصفح (POST + multipart/form-data من غير هيدرز مخصّصة)،
   * فمش بيحتاج preflight خالص، وبكده بيتجنب المشكلة من أساسها.
   */
  async getPresignedPostPolicy(
    key: string,
    options: { maxSizeBytes?: number; expiresInSeconds?: number } = {},
  ) {
    const { maxSizeBytes = DEFAULT_MAX_UPLOAD_BYTES, expiresInSeconds = 60 * 60 } = options;

    return createPresignedPost(this.uploadClient, {
      Bucket: this.bucket,
      Key: key,
      Conditions: [['content-length-range', 0, maxSizeBytes]],
      Expires: expiresInSeconds,
    });
  }

  /**
   * رفع ملف من مسار محلي (اللي multer بيكتبه مؤقتًا على قرص السيرفر) لـ B2 —
   * دي بقت الطريقة الأساسية لكل رفع (كوفر/صورة مدرب/فيديو/مرفق) بعد ما
   * ثبت إن B2 بترفض preflight (OPTIONS) بـ 403 لأي رفع مباشر من المتصفح
   * (PUT أو POST) — راجع getPresignedPostPolicy فوق لتفاصيل المحاولة اللي
   * فشلت. الرفع دلوقتي بيعدي على السيرفر بتاعنا (multer diskStorage) وبعدين
   * السيرفر هو اللي يرفعه لـ B2 من غير أي متصفح في النص، فمشكلة الـ CORS
   * مالهاش وجود خالص هنا.
   */
  getPresignedGetUrl(key: string, expiresInSeconds: number) {
    return getSignedUrl(
      this.deliveryClient,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  async getObjectText(key: string): Promise<string> {
    const res = await this.deliveryClient.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    return res.Body!.transformToString();
  }

  /** بيستخدمها الـ MediaController عشان يسقي (stream) صورة غلاف الكورس مباشرة
   * من B2 من غير ما يكشف الـ bucket أو يعتمد على presigned URL بمدة صلاحية
   * محدودة (السقف عند S3-compatible storage 7 أيام بس، مش مناسب لصورة عامة
   * دايمة). الـ ContentType بيرجع كما اتخزن وقت الرفع (المتصفح بيبعته تلقائيًا
   * مع الـ PUT). */
  async getObjectStream(
    key: string,
  ): Promise<{ body: NodeJS.ReadableStream; contentType?: string }> {
    const res = await this.deliveryClient.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    return { body: res.Body as NodeJS.ReadableStream, contentType: res.ContentType };
  }

  async uploadFile(key: string, localPath: string, contentType?: string) {
    await this.uploadClient.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fs.createReadStream(localPath),
        ContentType: contentType,
      }),
    );
  }

  async downloadToFile(key: string, localPath: string) {
    const res = await this.deliveryClient.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    await pipeline(
      res.Body as NodeJS.ReadableStream,
      fs.createWriteStream(localPath),
    );
  }

  async deleteByPrefix(prefix: string) {
    let continuationToken: string | undefined;

    do {
      const listed = await this.uploadClient.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const keys = (listed.Contents ?? [])
        .map((obj) => obj.Key)
        .filter((key): key is string => Boolean(key));

      for (let i = 0; i < keys.length; i += DELETE_BATCH_SIZE) {
        const batch = keys.slice(i, i + DELETE_BATCH_SIZE);
        await this.uploadClient.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: batch.map((Key) => ({ Key })) },
          }),
        );
      }

      continuationToken = listed.IsTruncated
        ? listed.NextContinuationToken
        : undefined;
    } while (continuationToken);
  }
}
