"use client";

import { useMemo, useState } from 'react';
import type { SimulationFile } from './types';
import ImageViewer from '../../common/ImageViewer';

interface Props {
  files: SimulationFile[];
  mode: 'side' | 'slider' | 'diff';
}

export default function ImageComparePanel({ files, mode }: Props) {
  // 取前两张图片作为示意
  const [ratio, setRatio] = useState(50);
  const images = useMemo(() => {
    const resolved = files
      .map(file => ({
        name: file.name,
        src: file.preview?.imageUrl || file.preview?.imageUrls?.[0] || (file.preview?.pdfUrl ?? ''),
        caption: file.preview?.imageCaption
      }))
      .filter(item => !!item.src && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(item.src));
    const fallback = '/mock/previews/placeholder-a.png';
    if (resolved.length === 0) {
      return [
        { name: '图像A', src: fallback, caption: undefined },
        { name: '图像B', src: fallback, caption: undefined }
      ];
    }
    if (resolved.length === 1) {
      return [resolved[0], resolved[0]];
    }
    return resolved.slice(0, 2);
  }, [files]);

  if (mode === 'side') {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {images.map((image, index) => (
          <ImageViewer
            key={`${image.src}-${index}`}
            src={image.src}
            alt={image.name}
            caption={image.caption}
            height={320}
            allowMaximize
          />
        ))}
      </div>
    );
  }

  if (mode === 'slider') {
    return (
      <div className="relative h-72 overflow-hidden rounded-lg border border-gray-200 bg-gray-900/10">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url('${images[1]?.src}')` }}
        ></div>
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage: `url('${images[0]?.src}')`,
            clipPath: `polygon(0 0, ${ratio}% 0, ${ratio}% 100%, 0 100%)`
          }}
        ></div>
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center">
          <input
            type="range"
            min={0}
            max={100}
            value={ratio}
            onChange={event => setRatio(Number(event.target.value))}
            className="h-1 w-1/2 accent-blue-600"
          />
        </div>
      </div>
    );
  }

  // diff
  return (
    <div className="relative h-72 overflow-hidden rounded-lg border border-gray-200">
      <div
        className="absolute inset-0 bg-center bg-cover opacity-60"
        style={{ backgroundImage: `url('${images[0]?.src}')` }}
      ></div>
      <div className="relative flex h-full w-full items-center justify-center text-sm text-gray-600 backdrop-blur-[1px]">
        像素差异热图（占位）
      </div>
    </div>
  );
}
