import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, ShieldCheck } from "lucide-react";
import { appSettingsSchema, type AppSettings } from "../schemas/slider";
import { api } from "../lib/api/client";
import { Toggle } from "../components/forms/Fields";
import { Button } from "../components/ui/button";
import { PageHeading, ErrorNotice, LoadingCards } from "./Shared";
export function Settings() {
  const query = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<AppSettings>("settings"),
  });
  const form = useForm<AppSettings>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: appSettingsSchema.parse({}),
  });
  useEffect(() => {
    if (query.data) form.reset(query.data);
  }, [query.data, form]);
  return (
    <>
      <PageHeading
        title="Make it work your way"
        description="Set the defaults for your next creation and manage analytics preferences."
      />
      {query.isError ? (
        <ErrorNotice
          message={query.error.message}
          retry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <LoadingCards />
      ) : (
        <form
          className="max-w-2xl"
          onSubmit={form.handleSubmit(async (data) => {
            try {
              await api("settings", "PUT", data);
              form.reset(data);
              toast.success("Settings saved");
            } catch (e) {
              toast.error(
                e instanceof Error ? e.message : "Settings could not be saved",
              );
            }
          })}
        >
          <section className="surface p-6 space-y-6 mb-5">
            <h2 className="text-base font-semibold">Creation defaults</h2>
            <Toggle
              label="Autoplay new sliders"
              value={form.watch("defaultAutoplay")}
              onChange={(v) =>
                form.setValue("defaultAutoplay", v, { shouldDirty: true })
              }
            />
            <p className="muted">
              You can override these choices in every slider.
            </p>
          </section>
          <section className="surface p-6 space-y-6 mb-5">
            <h2 className="text-base font-semibold">Analytics & privacy</h2>
            <Toggle
              label="Enable analytics for new sliders"
              value={form.watch("analytics")}
              onChange={(v) =>
                form.setValue("analytics", v, { shouldDirty: true })
              }
            />
            <Toggle
              label="Respect Do Not Track"
              value={form.watch("respectDnt")}
              onChange={(v) =>
                form.setValue("respectDnt", v, { shouldDirty: true })
              }
            />
            <div className="bg-gray-50 rounded-lg p-4 flex gap-3">
              <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed m-0">
                Analytics use anonymous browser session IDs. Content and
                analytics are stored in Wix Data for the current site.
              </p>
            </div>
          </section>
          <div className="flex items-center gap-3">
            <Button
              disabled={form.formState.isSubmitting || !form.formState.isDirty}
            >
              <Save size={16} />
              {form.formState.isSubmitting ? "Saving…" : "Save settings"}
            </Button>
            {form.formState.isDirty && !form.formState.isSubmitting && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => form.reset()}
                >
                  Discard
                </Button>
                <span className="muted">You have unsaved changes.</span>
              </>
            )}
          </div>
        </form>
      )}
    </>
  );
}
