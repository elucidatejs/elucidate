/** Reuse statements for the common licenses (spec §9.3); other values are printed as given. */
const LICENSES: Record<string, { name: string; url: string }> = {
  'CC-BY-4.0': {
    name: 'Creative Commons Attribution (CC BY 4.0)',
    url: 'https://creativecommons.org/licenses/by/4.0/',
  },
  'CC-BY-SA-4.0': {
    name: 'Creative Commons Attribution-ShareAlike (CC BY-SA 4.0)',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  'CC0-1.0': {
    name: 'CC0 1.0 (public domain dedication)',
    url: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
};

export function licenseInfo(license: string): { name: string; url?: string } {
  return LICENSES[license] ?? { name: license };
}

/**
 * Links for "Updates and corrections". `repository` may point at a subfolder of a GitHub repository
 * (`https://github.com/org/repo/tree/main/site`) when the site does not live at its root.
 */
export function repositoryLinks(
  repository: string,
  slug: string,
  title: string,
): { history: string; issue: string } {
  const match =
    /^(https:\/\/github\.com\/[^/]+\/[^/]+?)(?:\.git)?(?:\/tree\/([^/]+)(\/.*?)?)?\/?$/.exec(
      repository,
    );
  const root = match?.[1] ?? repository.replace(/\/+$/, '');
  const branch = match?.[2] ?? 'main';
  const folder = match?.[3]?.replace(/\/+$/, '') ?? '';
  return {
    history: `${root}/commits/${branch}${folder}/src/articles/${slug}`,
    issue: `${root}/issues/new?title=${encodeURIComponent(`Correction: ${title}`)}`,
  };
}
