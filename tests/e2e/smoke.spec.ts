import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
  test('login screen renderiza', async ({ page }) => {
    await page.goto('/');
    // La app monta basename='/erp', así que / redirige.
    await expect(page).toHaveURL(/\/erp/);

    // Debe ver el campo de email del LoginScreen (asume input[type=email]).
    await expect(page.getByRole('textbox', { name: /email|correo/i }).or(page.locator('input[type=email]'))).toBeVisible({ timeout: 10_000 });
  });

  test('credenciales inválidas muestran error', async ({ page }) => {
    await page.goto('/');
    const email = page.locator('input[type=email]').first();
    const password = page.locator('input[type=password]').first();
    await email.fill('no-existe@warica.test');
    await password.fill('contraseñaIncorrecta!');
    await page.getByRole('button', { name: /entrar|login|iniciar/i }).first().click();

    // Debe aparecer algún mensaje de error (Invalid login credentials, etc.)
    await expect(page.getByText(/invalid|incorrect|incorrecta|error/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Auth flow (requiere E2E_USER_EMAIL / E2E_USER_PASSWORD)', () => {
  test.skip(!process.env.E2E_USER_EMAIL, 'sin credenciales de prueba');

  test('login exitoso lleva al CRM', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type=email]').first().fill(process.env.E2E_USER_EMAIL!);
    await page.locator('input[type=password]').first().fill(process.env.E2E_USER_PASSWORD!);
    await page.getByRole('button', { name: /entrar|login|iniciar/i }).first().click();

    await expect(page).toHaveURL(/\/erp\/crm/, { timeout: 15_000 });
  });
});
