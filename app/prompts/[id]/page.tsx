"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useStudio } from "@/context/StudioContext";
import { PromptStudioWorkbench } from "@/components/studio/PromptStudioWorkbench";

export default function PromptStudioPage() {
  const params = useParams();
  const { selectPrompt } = useStudio();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      selectPrompt(id);
    }
  }, [id, selectPrompt]);

  return <PromptStudioWorkbench />;
}
