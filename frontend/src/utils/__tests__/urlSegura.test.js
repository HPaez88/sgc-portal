import { describe, it, expect } from 'vitest';
import { urlSegura } from '../urlSegura';

describe('urlSegura', () => {
  it('bloquea esquemas que ejecutan código', () => {
    expect(urlSegura('javascript:alert(1)')).toBeUndefined();
    expect(urlSegura('  JavaScript:alert(1)')).toBeUndefined();
    expect(urlSegura('data:text/html,<script>x</script>')).toBeUndefined();
    expect(urlSegura('vbscript:x')).toBeUndefined();
    expect(urlSegura('//otro.sitio/x')).toBeUndefined();
    expect(urlSegura(null)).toBeUndefined();
  });
  it('deja pasar evidencias legítimas', () => {
    expect(urlSegura('https://s3.us-west.backblazeb2.com/x.webp')).toBe('https://s3.us-west.backblazeb2.com/x.webp');
    expect(urlSegura('/api/v1/archivos/12/url')).toBe('/api/v1/archivos/12/url');
    expect(urlSegura('data:image/webp;base64,AAA')).toBe('data:image/webp;base64,AAA');
    expect(urlSegura('data:application/pdf;base64,AAA')).toBe('data:application/pdf;base64,AAA');
    expect(urlSegura('blob:http://x/1')).toBe('blob:http://x/1');
  });
});
