import { expect, test, type Page } from "@playwright/test";

const openSliders = async (page: Page) => {
  await page.goto("/#sliders");
  await expect(
    page.getByRole("heading", { name: "Your sliders" }),
  ).toBeVisible();
};

test("saved edits to a published slider are flagged until republished", async ({
  page,
}) => {
  await openSliders(page);
  await page.getByRole("button", { name: "Actions for Weekend Edit" }).click();
  await page.getByRole("menuitem", { name: "Publish", exact: true }).click();
  await expect(page.getByText("Slider published")).toBeVisible();

  await page
    .getByRole("button", { name: /Weekend Edit/ })
    .first()
    .click();
  const name = page.getByRole("textbox", { name: "Slider name" });
  await name.fill("Weekend Edit v2");
  await expect(page.getByText("Unpublished changes")).toHaveCount(0);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Unpublished changes")).toBeVisible();

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByText("Slider published").last()).toBeVisible();
  await expect(page.getByText("Unpublished changes")).toHaveCount(0);
});

test("typing a slider name is a single undo step", async ({ page }) => {
  await openSliders(page);
  await page
    .getByRole("button", { name: /Lookbook/ })
    .first()
    .click();
  const name = page.getByRole("textbox", { name: "Slider name" });
  await name.pressSequentially(" draft");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(name).toHaveValue("Lookbook");
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
});

test("saved templates can be named, renamed and deleted", async ({ page }) => {
  await openSliders(page);
  await page
    .getByRole("button", { name: /Studio Portfolio/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Save as template" }).click();
  await page
    .getByRole("textbox", { name: "Template name" })
    .fill("Gallery look");
  await page.getByRole("button", { name: "Save template" }).click();
  await expect(page.getByText("Design saved as a template")).toBeVisible();

  await page.getByRole("button", { name: "Back to sliders" }).click();
  await page.getByRole("button", { name: "Templates" }).first().click();
  await page.getByRole("button", { name: "My templates" }).click();
  await expect(
    page.getByRole("heading", { name: "Gallery look" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Rename Gallery look" }).click();
  await page
    .getByRole("textbox", { name: "Template name" })
    .fill("Gallery grid");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(
    page.getByRole("heading", { name: "Gallery grid" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Delete Gallery grid" }).click();
  await page.getByRole("button", { name: "Delete template" }).click();
  await expect(page.getByRole("heading", { name: "Gallery grid" })).toHaveCount(
    0,
  );
  // With no saved templates left, the list falls back to every template, and
  // built-in templates can't be renamed or deleted.
  await expect(page.getByRole("button", { name: "My templates" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Use Hero Banner" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Rename / })).toHaveCount(0);
});

test("the site widget renders a published slider", async ({ page }) => {
  await page.goto("/?scene=site");
  const hero = page.getByRole("region", { name: "Homepage Hero" });
  await expect(hero).toBeVisible();
  await expect(hero.getByRole("button", { name: "Next slide" })).toBeVisible();
});
