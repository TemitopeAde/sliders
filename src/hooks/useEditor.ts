import { useState, useRef, useEffect, useCallback } from "react";
import { dashboard } from "@wix/dashboard";
import { toast } from "sonner";
import { sliderSchema, type Slider } from "../schemas/slider";
import { api } from "../lib/api/client";
export function useEditor(initial: Slider, onSaved: (s: Slider) => void) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Slider[]>([]);
  const [future, setFuture] = useState<Slider[]>([]);
  const latest = useRef(draft);
  latest.current = draft;
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const change = useCallback((next: Slider) => {
    setHistory((h) => [...h.slice(-49), latest.current]);
    setFuture([]);
    setDraft(next);
    setError("");
  }, []);
  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((f) => [draft, ...f]);
    setHistory((h) => h.slice(0, -1));
    setDraft(previous);
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((h) => [...h, draft]);
    setFuture((f) => f.slice(1));
    setDraft(next);
  };
  const save = async () => {
    if (busy) return undefined;
    const checked = sliderSchema.safeParse({
      ...latest.current,
      revision: saved.revision,
    });
    if (!checked.success) {
      const issue = checked.error.issues[0];
      const message = `${issue?.path.join(" → ")}: ${issue?.message}`;
      setError(message);
      toast.error(message);
      return undefined;
    }
    setBusy(true);
    setError("");
    try {
      const { _id, createdAt, updatedAt, ...payload } = checked.data;
      const result = await api<Slider>(`sliders/${_id}`, "PATCH", payload);
      setSaved(result);
      setDraft(result);
      setHistory([]);
      setFuture([]);
      onSaved(result);
      toast.success("Slider saved");
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed";
      setError(message);
      toast.error(message);
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    const result = dirty ? await save() : saved;
    if (!result) return;
    setBusy(true);
    try {
      const published = await api<Slider>(
        `sliders/${result._id}/publish`,
        "POST",
      );
      setSaved(published);
      setDraft(published);
      onSaved(published);
      toast.success("Slider published");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    let listener: { remove: () => void } | undefined;
    try {
      listener = dashboard.onBeforeUnload((e) => {
        if (dirty) e.preventDefault();
      });
    } catch {
      /* Standalone local preview has no dashboard host. */
    }
    return () => {
      window.removeEventListener("beforeunload", handler);
      listener?.remove();
    };
  }, [dirty]);
  return {
    draft,
    change,
    undo,
    redo,
    canUndo: !!history.length,
    canRedo: !!future.length,
    dirty,
    busy,
    error,
    save,
    publish,
  };
}
