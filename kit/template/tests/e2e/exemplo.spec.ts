import { test, expect } from '@playwright/test';

// Teste mínimo de exemplo. Troque o fluxo pelo da sua aplicação.
// BASE_URL vem do ambiente (padrão: app local).
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

test('a página inicial carrega e mostra o título principal', async ({ page }) => {
  await page.goto(baseURL);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
