import { NextRequest, NextResponse } from 'next/server';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db, files, tasks } from '@zyroz/database';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  authorize,
  assertClient,
  taskScope,
  ApiError,
  checkOrigin,
} from '@/lib/server';
const input = z.object({
  entity: z.enum(['client', 'task']),
  entityId: z.uuid(),
  name: z.string().min(1).max(200),
  mimeType: z.enum([
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
    'text/plain',
  ]),
  size: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024),
  objectKey: z.string().optional(),
});
function storage() {
  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.R2_BUCKET_NAME
  )
    throw new ApiError(503, 'File storage is not configured.');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}
async function access(headers: Headers, entity: 'client' | 'task', id: string) {
  const actor = await authorize(
    headers,
    entity === 'client' ? 'clients' : 'tasks',
  );
  if (entity === 'client') await assertClient(actor, id);
  else {
    const [task] = await db()
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), taskScope(actor)));
    if (!task) throw new ApiError(404, 'Task not found.');
  }
  return actor;
}
export async function GET(req: NextRequest) {
  try {
    const id = z.uuid().parse(req.nextUrl.searchParams.get('id'));
    const [file] = await db().select().from(files).where(eq(files.id, id));
    if (!file) throw new ApiError(404, 'File not found.');
    await access(
      req.headers,
      file.clientId ? 'client' : 'task',
      file.clientId || file.taskId!,
    );
    const url = await getSignedUrl(
      storage(),
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: file.objectKey,
        ResponseContentDisposition: `attachment; filename="${file.name.replace(/["\r\n\\]/g, '_')}"`,
      }),
      { expiresIn: 60 },
    );
    return NextResponse.redirect(url);
  } catch (error) {
    return failure(error);
  }
}
async function upload(req: NextRequest) {
  try {
    checkOrigin(req);
    const value = input.parse(await req.json());
    const actor = await access(req.headers, value.entity, value.entityId);
    const prefix = `${actor.id}/${value.entity}/${value.entityId}/`;
    const client = storage();
    if (req.method === 'POST') {
      const objectKey = prefix + crypto.randomUUID();
      const url = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: objectKey,
          ContentType: value.mimeType,
          ContentLength: value.size,
        }),
        { expiresIn: 300 },
      );
      return NextResponse.json({ url, objectKey });
    }
    if (
      !value.objectKey?.startsWith(prefix) ||
      value.objectKey.slice(prefix.length).includes('/')
    )
      throw new ApiError(403, 'Invalid file reference.');
    const object = await client.send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: value.objectKey,
      }),
    );
    if (
      object.ContentLength !== value.size ||
      object.ContentType !== value.mimeType
    )
      throw new ApiError(400, 'Uploaded file does not match its metadata.');
    const [row] = await db()
      .insert(files)
      .values({
        clientId: value.entity === 'client' ? value.entityId : null,
        taskId: value.entity === 'task' ? value.entityId : null,
        name: value.name,
        mimeType: value.mimeType,
        size: value.size,
        objectKey: value.objectKey,
        uploadedBy: actor.id,
      })
      .onConflictDoNothing({ target: files.objectKey })
      .returning();
    return NextResponse.json(row || { success: true });
  } catch (error) {
    return failure(error);
  }
}
function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : error instanceof z.ZodError
            ? 'Invalid file details.'
            : 'File operation failed.',
    },
    {
      status:
        error instanceof ApiError
          ? error.status
          : error instanceof z.ZodError
            ? 400
            : 503,
    },
  );
}
export const POST = upload;
export const PATCH = upload;
