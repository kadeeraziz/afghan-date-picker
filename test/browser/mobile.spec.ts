import { expect } from '@playwright/test';
import { test } from './harness';

test.describe('Afghan date picker — narrow mobile viewport', () => {
  test('keeps the popup inside a 320x400 viewport when the input is at the right-bottom edge', async ({ picker }) => {
    await picker.mount({ initialDate: { year: 1403, month: 1, day: 1 } });
    await picker.placeInputNearBottomRight();
    await picker.open();

    const viewport = picker.page.viewportSize();
    expect(viewport).toEqual({ width: 320, height: 400 });
    const box = await picker.dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(Math.ceil(box!.x + box!.width)).toBeLessThanOrEqual(viewport!.width);
    expect(Math.ceil(box!.y + box!.height)).toBeLessThanOrEqual(viewport!.height);
  });

  test('the date grid remains usable without horizontal overflow', async ({ picker }) => {
    await picker.mount({ initialDate: { year: 1403, month: 1, day: 1 } });
    await picker.placeInputNearBottomRight();
    await picker.open();

    const viewport = picker.page.viewportSize()!;
    const box = await picker.dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(viewport.width);

    const hasNoHorizontalOverflow = await picker.dialog.evaluate((element) => {
      const grid = element.querySelector<HTMLElement>('[role="grid"]');
      return grid ? grid.scrollWidth <= grid.clientWidth : false;
    });
    expect(hasNoHorizontalOverflow).toBe(true);
  });

  test('the popup can scroll vertically when its content exceeds the viewport', async ({ picker }) => {
    await picker.mount({ initialDate: { year: 1403, month: 1, day: 1 } });
    await picker.page.setViewportSize({ width: 320, height: 200 });
    await picker.placeInputNearBottomRight();
    await picker.open();

    const metrics = await picker.dialog.evaluate((element) => ({
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      overflowY: getComputedStyle(element).overflowY
    }));

    expect(metrics.overflowY).toMatch(/auto|scroll|overlay/);
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);

    const scrolledTo = await picker.dialog.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      return element.scrollTop;
    });
    expect(scrolledTo).toBeGreaterThan(0);
  });
});