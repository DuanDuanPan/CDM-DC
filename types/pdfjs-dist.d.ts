declare module 'pdfjs-dist/build/pdf' {
  export interface PDFWorkerOptions {
    workerSrc: string;
  }

  export const GlobalWorkerOptions: PDFWorkerOptions;

  export interface GetDocumentParams {
    url?: string;
    data?: ArrayBuffer | Uint8Array;
    withCredentials?: boolean;
    disableWorker?: boolean;
    [key: string]: unknown;
  }

  export interface PDFDocumentProxy {
    destroy: () => Promise<void>;
    getPage: (pageNumber: number) => Promise<unknown>;
    numPages: number;
    [key: string]: unknown;
  }

  export interface PDFLoadingTask<T = PDFDocumentProxy> {
    promise: Promise<T>;
    destroy: () => void;
  }

  export function getDocument(
    src: string | ArrayBuffer | GetDocumentParams,
  ): PDFLoadingTask;
}
