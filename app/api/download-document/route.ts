import { NextRequest, NextResponse } from 'next/server';

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
    const baseUrl = request.nextUrl.origin;
    const fileUrl = `${baseUrl}/${normalizedPath}`;

    console.log('Download request:', { filePath, normalizedPath, fileUrl });

    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      return NextResponse.json(
        {
          error: 'File not found',
          details: `Unable to fetch file at ${normalizedPath}`,
          status: fileResponse.status
        },
        { status: 404 }
      );
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const downloadName = fileName || filePath.split('/').pop() || 'document.pdf';

    const asciiFilename = downloadName.replace(/[^\x00-\x7F]/g, '');
    const encodedFilename = encodeURIComponent(downloadName);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': fileBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Download error:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      {
        error: 'File not found or cannot be read',
        details: error.message
      },
      { status: 404 }
    );
  }
}
