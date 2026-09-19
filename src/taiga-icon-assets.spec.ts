import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The build no longer copies the whole `@taiga-ui/icons` package — 4,280 SVG per locale, 34 MB of
 * deploy for the few dozen icons this product renders. `angular.json` lists the icons instead, and
 * a missing one is invisible until it 404s in a browser, so this test is the thing that makes the
 * list maintainable: reference a new icon from a template and it fails here, not in production.
 *
 * Nothing in this file may spell an icon reference literally — the scan below reads it too.
 */

const ICON_REFERENCE = /@tui\.([a-z0-9-]+)/g;

const TAIGA_PACKAGES = ['core', 'cdk', 'kit', 'layout', 'addon-table'];

function collectFiles(directory: string, matches: (name: string) => boolean): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectFiles(path, matches);
    }

    return matches(entry.name) ? [path] : [];
  });
}

function iconsReferencedIn(paths: string[]): Set<string> {
  const icons = new Set<string>();

  for (const path of paths) {
    for (const [, name] of readFileSync(path, 'utf8').matchAll(ICON_REFERENCE)) {
      icons.add(name);
    }
  }

  return icons;
}

interface Workspace {
  readonly projects: Record<
    string,
    { architect: { build: { options: { assets: { glob: string; input: string }[] } } } }
  >;
}

function bundledIcons(): Set<string> {
  const workspace = JSON.parse(readFileSync('angular.json', 'utf8')) as Workspace;
  const assets = workspace.projects['univgo-frontend'].architect.build.options.assets;

  const entry = assets.find((asset) => asset.input.includes('@taiga-ui/icons'));
  const names = entry?.glob.match(/^\{(.+)\}\.svg$/)?.[1];

  return new Set(names?.split(',') ?? []);
}

describe('Taiga UI icon assets', () => {
  const bundled = bundledIcons();

  it('copies every icon the application references', () => {
    const sources = collectFiles('src', (name) => name.endsWith('.html') || name.endsWith('.ts'));
    const referenced = [...iconsReferencedIn(sources)].sort();

    expect(referenced.filter((icon) => !bundled.has(icon))).toEqual([]);
    expect(referenced.length).toBeGreaterThan(0);
  });

  /**
   * Taiga renders icons the application never names: the textfield's clear button, the calendar's
   * arrows, the alert's close. They live inside the published bundles, so the list has to be
   * rebuilt whenever the library is upgraded.
   */
  it('copies every icon the library renders on its own', () => {
    const bundles = TAIGA_PACKAGES.flatMap((name) =>
      collectFiles(join('node_modules', '@taiga-ui', name, 'fesm2022'), (file) =>
        file.endsWith('.mjs'),
      ),
    );
    const referenced = [...iconsReferencedIn(bundles)].sort();

    expect(referenced.filter((icon) => !bundled.has(icon))).toEqual([]);
    expect(referenced.length).toBeGreaterThan(0);
  });
});
