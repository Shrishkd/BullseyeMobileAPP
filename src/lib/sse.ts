/**
 * Incremental Server-Sent Events parser. Feed it decoded text chunks as they
 * arrive; it calls `onData` with the payload of each complete event's `data:`
 * lines. Pure (no I/O) so it can be unit tested.
 */
export function createSSEParser(onData: (data: string) => void) {
  let buffer = '';

  function flushFrame(frame: string) {
    const dataLines: string[] = [];
    for (const raw of frame.split('\n')) {
      const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
      if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
    }
    if (dataLines.length > 0) onData(dataLines.join('\n'));
  }

  return {
    push(chunk: string) {
      buffer += chunk.replace(/\r\n/g, '\n');
      let idx = buffer.indexOf('\n\n');
      while (idx !== -1) {
        flushFrame(buffer.slice(0, idx));
        buffer = buffer.slice(idx + 2);
        idx = buffer.indexOf('\n\n');
      }
    },
    /** Flush a trailing event that was not terminated by a blank line. */
    end() {
      if (buffer.trim()) flushFrame(buffer);
      buffer = '';
    },
  };
}
