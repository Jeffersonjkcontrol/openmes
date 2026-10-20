import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Every string a screen passes to __() must exist in each lang file. A key that
// is missing doesn't fail anywhere — __() falls back to the English source — so
// the screen silently stays in English for that language. This walks the
// frontend sources the same way a reviewer would grep them.

const JS_ROOT = fileURLToPath(new URL('..', import.meta.url));
const LANG_ROOT = fileURLToPath(new URL('../../../lang/', import.meta.url));

const LOCALES = ['en', 'pl', 'pt_BR'];
const lang = Object.fromEntries(
    LOCALES.map((l) => [l, JSON.parse(readFileSync(join(LANG_ROOT, `${l}.json`), 'utf8'))]),
);

function sourceFiles(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) return sourceFiles(path);
        return /\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [path] : [];
    });
}

// __('…'), __("…") and __(`…`) without interpolation — the literal first
// argument only; a computed key (__(label)) can't be checked statically.
const CALL = /\b__\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|`((?:\\.|[^`\\$])*)`)\s*[,)]/g;

function unescape(raw) {
    return raw.replace(/\\(.)/g, (_, c) => ({ n: '\n', t: '\t' }[c] ?? c));
}

function usedKeys() {
    const keys = new Map();
    for (const file of sourceFiles(JS_ROOT)) {
        for (const m of readFileSync(file, 'utf8').matchAll(CALL)) {
            const key = unescape(m[1] ?? m[2] ?? m[3]);
            if (!keys.has(key)) keys.set(key, file.slice(JS_ROOT.length));
        }
    }
    return keys;
}

// Laravel-style :placeholders. A colon inside a word ("key:value") is not one.
const placeholders = (s) => [...new Set(s.match(/(?<![\w]):[A-Za-z_]+/g) ?? [])].sort();

describe('lang files', () => {
    const keys = usedKeys();

    it('finds the __() calls it is meant to check', () => {
        expect(keys.size).toBeGreaterThan(1000);
        expect(keys.has('Save')).toBe(true);
    });

    it.each(LOCALES)('%s.json has every key the frontend passes to __()', (locale) => {
        const missing = [...keys].filter(([key]) => !(key in lang[locale])).map(([key, file]) => `${key}  (${file})`);
        expect(missing).toEqual([]);
    });

    it('keeps the same key set in every locale', () => {
        const en = Object.keys(lang.en).sort();
        for (const locale of LOCALES) {
            expect(Object.keys(lang[locale]).sort()).toEqual(en);
        }
    });

    it.each(['pl', 'pt_BR'])('%s.json keeps the :placeholders of each English key', (locale) => {
        const mismatched = Object.keys(lang.en).filter(
            (key) => placeholders(lang[locale][key] ?? '').join() !== placeholders(key).join(),
        );
        expect(mismatched).toEqual([]);
    });
});
