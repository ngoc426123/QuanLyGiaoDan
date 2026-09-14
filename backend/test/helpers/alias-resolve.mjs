import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

/** Thư mục `shared/` nằm ngoài package `backend/`, nên `imports` của Node không với tới. */
const SHARED_DIR = new URL('../../../shared/', import.meta.url)

/** `#/` là alias của bundler, không phải subpath imports của Node (Node cấm khoá bắt đầu bằng `#/`). */
const SRC_DIR = new URL('../../src/', import.meta.url)

const RAW_SUFFIX = '?raw'

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@shared/')) {
    return {
      url: new URL(specifier.slice('@shared/'.length), SHARED_DIR).href,
      shortCircuit: true,
    }
  }

  if (specifier.startsWith('#/')) {
    return { url: new URL(specifier.slice(2), SRC_DIR).href, shortCircuit: true }
  }

  if (specifier.endsWith(RAW_SUFFIX)) {
    return { url: new URL(specifier, context.parentURL).href, shortCircuit: true }
  }

  return next(specifier, context)
}

export async function load(url, context, next) {
  if (url.endsWith(RAW_SUFFIX)) {
    const source = await readFile(fileURLToPath(url.slice(0, -RAW_SUFFIX.length)), 'utf8')

    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default ' + JSON.stringify(source),
    }
  }

  return next(url, context)
}
