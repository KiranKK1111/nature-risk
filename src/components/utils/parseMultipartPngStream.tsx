// src/components/utils/parseMultipartPngStream.ts
export async function* parseMultipartPngStream(
    response: Response,
    boundary: string = '--pngboundary'
): AsyncGenerator<{ filename: string, blobUrl: string }, void, unknown> {
    const reader = response.body!.getReader();
    let buffer = '';
    const decoder = new TextDecoder();
    const boundaryStr = boundary + '\r\n';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundaryIndex: number;
        while ((boundaryIndex = buffer.indexOf(boundaryStr)) !== -1) {
            const part = buffer.slice(0, boundaryIndex);
            buffer = buffer.slice(boundaryIndex + boundaryStr.length);

            // Extract filename from Content-Disposition header
            const contentDispMatch = part.match(/filename=\"([^\"]+)\"/);
            const filename = contentDispMatch ? contentDispMatch[1] : undefined;

            // Find PNG header
            const headerEnd = part.indexOf('\r\n\r\n');
            if (headerEnd !== -1 && filename) {
                // Extract binary PNG data (after headers)
                const binaryString = part.slice(headerEnd + 4);
                if (binaryString.length > 0) {
                    const byteArray = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        byteArray[i] = binaryString.charCodeAt(i) & 0xff;
                    }
                    const blob = new Blob([byteArray], { type: 'image/png' });
                    yield { filename, blobUrl: URL.createObjectURL(blob) };
                }
            }
        }
    }
}