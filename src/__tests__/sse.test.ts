import { createSSEParser } from '@/lib/sse';

describe('createSSEParser', () => {
  it('emits one payload per complete event', () => {
    const out: string[] = [];
    const p = createSSEParser((d) => out.push(d));
    p.push('data: {"type":"status"}\n\ndata: {"type":"done"}\n\n');
    expect(out).toEqual(['{"type":"status"}', '{"type":"done"}']);
  });

  it('buffers events split across chunks', () => {
    const out: string[] = [];
    const p = createSSEParser((d) => out.push(d));
    p.push('data: {"ty');
    p.push('pe":"verdict"}\n');
    expect(out).toEqual([]);
    p.push('\n');
    expect(out).toEqual(['{"type":"verdict"}']);
  });

  it('handles CRLF line endings and ignores non-data fields', () => {
    const out: string[] = [];
    const p = createSSEParser((d) => out.push(d));
    p.push('event: msg\r\nid: 1\r\ndata: hello\r\n\r\n: comment\r\n\r\n');
    expect(out).toEqual(['hello']);
  });

  it('joins multi-line data fields and flushes a trailing event on end()', () => {
    const out: string[] = [];
    const p = createSSEParser((d) => out.push(d));
    p.push('data: a\ndata: b');
    p.end();
    expect(out).toEqual(['a\nb']);
  });
});
