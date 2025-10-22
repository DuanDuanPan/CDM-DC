/// <reference lib="webworker" />

const CHUNK_SIZE = 512 * 1024;

type WorkerRequest = {
  id: string;
  file: File;
};

type WorkerProgressMessage = {
  type: 'progress';
  id: string;
  loaded: number;
  total: number;
};

type WorkerResultMessage = {
  type: 'result';
  id: string;
  text: string;
};

type WorkerErrorMessage = {
  type: 'error';
  id: string;
  message: string;
};

const postProgress = (id: string, loaded: number, total: number) => {
  const message: WorkerProgressMessage = { type: 'progress', id, loaded, total };
  (self as DedicatedWorkerGlobalScope).postMessage(message);
};

self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { id, file } = event.data;
  try {
    const total = file.size;
    const reader = new FileReaderSync();
    let offset = 0;
    let result = '';

    while (offset < total) {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const text = reader.readAsText(slice);
      result += text;
      offset += slice.size;
      postProgress(id, offset, total);
    }

    const message: WorkerResultMessage = { type: 'result', id, text: result };
    (self as DedicatedWorkerGlobalScope).postMessage(message);
  } catch (error) {
    const message: WorkerErrorMessage = {
      type: 'error',
      id,
      message: error instanceof Error ? error.message : String(error),
    };
    (self as DedicatedWorkerGlobalScope).postMessage(message);
  }
});

export {};
