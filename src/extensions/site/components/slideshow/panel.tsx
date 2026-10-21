import { useEffect, useState } from "react";
import { reactElements } from "@wix/editor";
import { items } from "@wix/data";
import {
  WixDesignSystemProvider,
  Box,
  FormField,
  Dropdown,
  SectionHelper,
  Loader,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import { COLLECTIONS } from "../../../../lib/wix/collections";

// Dropdown option for "show the slides edited on this page"; stored as "".
const PAGE_SLIDES = "__page-slides__";

async function publishedSliders() {
  let result = await items
    .query(COLLECTIONS.published)
    .ascending("name")
    .limit(100)
    .find();
  const all = [...result.items];
  while (result.hasNext()) {
    result = await result.next();
    all.push(...result.items);
  }
  return all.map((v) => ({ id: String(v._id), value: String(v.name) }));
}

export default function SliderPickerPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sliders, setSliders] = useState<{ id: string; value: string }[]>([]);
  // undefined: never chosen; "": this page's slides; otherwise a slider ID.
  const [sliderId, setSliderId] = useState<string>();

  useEffect(() => {
    let alive = true;
    let unsubscribe: (() => void) | undefined;
    Promise.all([reactElements.getData(), publishedSliders()])
      .then(async ([data, list]) => {
        if (!alive) return;
        let current = data?.dashboardSliderId as string | undefined;
        // With a single published slider and no choice made yet, pick it.
        if (current === undefined && list.length === 1) {
          current = list[0]!.id;
          await reactElements.setData({ dashboardSliderId: current });
        }
        setSliders(list);
        setSliderId(current);
      })
      .catch(() =>
        setError("We couldn't load your sliders. Reopen this panel to retry."),
      )
      .finally(() => alive && setLoading(false));
    // Keep the dropdown right when Aria or undo changes the slider.
    reactElements
      .onChange((patch) => {
        if (patch.type !== "data") return;
        const value = (patch.value as Record<string, unknown> | undefined)
          ?.dashboardSliderId;
        if (typeof value === "string") setSliderId(value);
      })
      .then((unsub) => {
        if (alive) unsubscribe = unsub;
        else unsub();
      });
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, []);

  const select = async (id: string) => {
    const value = id === PAGE_SLIDES ? "" : id;
    setSliderId(value);
    try {
      await reactElements.setData({ dashboardSliderId: value });
    } catch {
      setError("We couldn't apply that slider. Please try again.");
    }
  };

  const missing =
    !loading && !!sliderId && !sliders.some((s) => s.id === sliderId);
  const options = [
    { id: PAGE_SLIDES, value: "Slides on this page" },
    ...sliders,
  ];

  return (
    <WixDesignSystemProvider>
      <Box direction="vertical" padding="SP4" gap="SP3">
        {loading ? (
          <Box align="center" padding="SP4">
            <Loader size="small" />
          </Box>
        ) : (
          <>
            <FormField
              label="Show"
              id="dashboard-slider"
              infoContent="Choose a slider you published in the Slideshow Studio dashboard, or keep the slides you edit on this page."
            >
              <Dropdown
                id="dashboard-slider"
                size="small"
                placeholder="Choose a slider"
                options={options}
                selectedId={
                  missing ? undefined : sliderId ? sliderId : PAGE_SLIDES
                }
                onSelect={(v) => void select(String(v.id))}
                popoverProps={{ appendTo: "window" }}
              />
            </FormField>
            {missing && (
              <SectionHelper skin="warning">
                The slider chosen here was unpublished or deleted. Choose
                another one.
              </SectionHelper>
            )}
            {!sliders.length && !error && (
              <SectionHelper skin="standard">
                Publish a slider in the Slideshow Studio dashboard to show it here.
              </SectionHelper>
            )}
          </>
        )}
        {error && <SectionHelper skin="danger">{error}</SectionHelper>}
      </Box>
    </WixDesignSystemProvider>
  );
}
