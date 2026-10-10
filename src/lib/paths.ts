const configuredBase = import.meta.env.BASE_URL === '/'
  ? ''
  : import.meta.env.BASE_URL.replace(/\/$/, '');

export function sitePath(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${configuredBase}${normalized}` || '/';
}
