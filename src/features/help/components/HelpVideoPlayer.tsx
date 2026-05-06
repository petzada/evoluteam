'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface HelpVideoPlayerProps {
  videoUrl: string;
  title: string;
}

export function HelpVideoPlayer({ videoUrl, title }: HelpVideoPlayerProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        role="alert"
        className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted text-center"
      >
        <div className="flex flex-col items-center gap-2 px-4">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">Não foi possível carregar o vídeo.</p>
          <p className="text-xs text-muted-foreground">
            Tente recarregar a página. Se o problema persistir, avise o time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <video
      src={videoUrl}
      controls
      preload="metadata"
      aria-label={title}
      onError={() => setErrored(true)}
      className="aspect-video w-full rounded-lg bg-black"
    />
  );
}
