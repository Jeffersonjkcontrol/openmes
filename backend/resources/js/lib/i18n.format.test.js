import { afterEach, describe, expect, it } from 'vitest';
import { formatDateTime, formatNumber, loadLocale, localeTag, setTimezone } from './i18n';

// Laravel locale codes are not always BCP 47 tags: Intl throws a RangeError on
// "pt_BR", and one page that passed the raw code blanked the admin dashboard.
describe('formatting in a locale whose Laravel code is not a BCP 47 tag', () => {
    afterEach(() => setTimezone(undefined));

    it('maps pt_BR to pt-BR for dates and numbers', async () => {
        await loadLocale('pt_BR');
        setTimezone('America/Sao_Paulo');
        const opts = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        const at = new Date('2026-10-20T13:30:00Z');

        expect(() => at.toLocaleString('pt_BR', opts)).toThrow(RangeError);
        expect(localeTag()).toBe('pt-BR');
        // Compared with Intl itself: the exact text depends on the runtime's ICU data.
        expect(formatDateTime(at, opts)).toBe(at.toLocaleString('pt-BR', { ...opts, timeZone: 'America/Sao_Paulo' }));
        expect(formatNumber(1234.5, { minimumFractionDigits: 2 })).toBe((1234.5).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    });
});
