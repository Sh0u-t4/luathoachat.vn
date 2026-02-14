import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Force dynamic rendering to avoid Next.js static optimization issues
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path');
    const fileName = searchParams.get('name');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fullPath = join(process.cwd(), 'public', normalizedPath);

    console.log('Download request:', { filePath, normalizedPath, fullPath });

    const fileBuffer = await readFile(fullPath);

    const downloadName = fileName || filePath.split('/').pop() || 'document.pdf';

    const asciiFilename = downloadName.replace(/[^\x00-\x7F]/g, '');
    const encodedFilename = encodeURIComponent(downloadName);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Download error:', {
      message: error.message,
      code: error.code,
      path: error.path,
      stack: error.stack
    });
    return NextResponse.json(
      {
        error: 'File not found or cannot be read',
        details: error.message,
        path: error.path
      },
      { status: 404 }
    );
  }
}
