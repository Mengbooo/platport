import { expect, test } from '@playwright/test';

test('renders markdown preview without unsafe raw html', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Markdown 编辑器' }).click();
  await page.getByLabel('标题').fill('Security smoke');

  const editor = page.locator('.cm-content');
  await editor.click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.type('# Safe\n\n<script>alert(1)</script>\n\n<img src=x onerror="alert(2)">');
  await page.getByRole('button', { name: '预览' }).click();

  const preview = page.locator('.markdown-preview-content');
  await expect(preview).toContainText('Safe');
  await expect(preview.locator('script')).toHaveCount(0);
  await expect(preview.locator('[onerror]')).toHaveCount(0);
});

test('pastes clipboard images as short local asset refs instead of base64 markdown', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Markdown 编辑器' }).click();

  const editor = page.locator('.cm-content');
  await editor.click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.type('Before paste');

  await editor.evaluate((element) => {
    const file = new File(['tiny-png'], 'Component 56.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    element.dispatchEvent(
      new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer,
      }),
    );
  });

  await expect(editor).toContainText('platport-asset://');
  await expect(editor).not.toContainText('data:image');
});
