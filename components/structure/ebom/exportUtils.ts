"use client";

export async function ensureHtml2Canvas(): Promise<any> {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  if (w.html2canvas) return w.html2canvas;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('html2canvas load failed'));
    document.head.appendChild(s);
  });
  return (window as any).html2canvas;
}

interface ExportHeaderMeta {
  label: string;
  value: string;
}

interface ExportHeader {
  title: string;
  subtitle?: string;
  meta?: ExportHeaderMeta[];
}

interface ExportOptions {
  header?: ExportHeader;
  padding?: number;
}

const buildHeaderElement = (header: ExportHeader, padding: number): HTMLDivElement => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '4px';
  container.style.fontFamily = `'Inter', 'Helvetica Neue', Arial, sans-serif`;
  container.style.color = '#111827';

  const title = document.createElement('div');
  title.textContent = header.title;
  title.style.fontSize = '20px';
  title.style.fontWeight = '600';
  container.appendChild(title);

  if (header.subtitle) {
    const subtitle = document.createElement('div');
    subtitle.textContent = header.subtitle;
    subtitle.style.fontSize = '14px';
    subtitle.style.color = '#374151';
    container.appendChild(subtitle);
  }

  if (header.meta?.length) {
    const metaRow = document.createElement('div');
    metaRow.style.display = 'flex';
    metaRow.style.flexWrap = 'wrap';
    metaRow.style.gap = '8px';
    header.meta.forEach((item) => {
      const pill = document.createElement('span');
      pill.textContent = `${item.label}：${item.value}`;
      pill.style.fontSize = '12px';
      pill.style.padding = '4px 8px';
      pill.style.borderRadius = '9999px';
      pill.style.backgroundColor = '#EEF2FF';
      pill.style.color = '#4338CA';
      metaRow.appendChild(pill);
    });
    container.appendChild(metaRow);
  }

  const divider = document.createElement('div');
  divider.style.marginTop = `${padding / 2}px`;
  divider.style.height = '1px';
  divider.style.background = '#E5E7EB';
  container.appendChild(divider);

  return container;
};

export async function exportDomToPng(el: HTMLElement, filename = 'cockpit.png', options?: ExportOptions): Promise<void> {
  const html2canvas = await ensureHtml2Canvas();
  if (!html2canvas || !el) return;

  let target: HTMLElement = el;
  let cleanup: (() => void) | undefined;

  if (options?.header) {
    const rect = el.getBoundingClientRect();
    const wrapper = document.createElement('div');
    const padding = options.padding ?? 24;
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-99999px';
    wrapper.style.top = '0';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.padding = `${padding}px`;
    wrapper.style.width = `${Math.ceil(rect.width)}px`;
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.zIndex = '-1';

    const headerEl = buildHeaderElement(options.header, padding);
    wrapper.appendChild(headerEl);

    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.marginTop = `${padding / 2}px`;
    wrapper.appendChild(clone);

    document.body.appendChild(wrapper);
    target = wrapper;
    cleanup = () => {
      wrapper.remove();
    };
  }

  const canvas = await html2canvas(target, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
  cleanup?.();
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename;
  a.click();
}

export async function exportDomToPdf(el: HTMLElement, title = 'EBOM-Cockpit') {
  const html2canvas = await ensureHtml2Canvas();
  if (!html2canvas || !el) return;
  const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
  const dataUrl = canvas.toDataURL('image/png');
  const w = window.open('', '_blank');
  if (!w) return;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>@page { size: A4; margin: 12mm } body{margin:0;}
  img{width:100%; height:auto;}
  </style></head><body><img src="${dataUrl}" alt="snapshot"/></body></html>`;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch {} }, 300);
}
