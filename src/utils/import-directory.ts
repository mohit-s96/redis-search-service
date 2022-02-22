import fs from "fs";

function walk(dir: string) {
  let results = [];

  let list = fs.readdirSync(dir);

  list.forEach(function (file) {
    file = dir + "/" + file;
    let stat = fs.statSync(file);
    // check for symlink and ignore any if found
    if (stat && !stat.isSymbolicLink()) {
      if (stat && stat.isDirectory()) {
        /* Recurse into a subdirectory */
        results = results.concat(walk(file));
      } else {
        /* Is a file */
        results.push(file);
      }
    }
  });
  return results;
}

interface ImportDirOptions {
  visit?: (defaultExport: unknown) => Promise<unknown> | unknown;
  include?: RegExp;
}
// simple replacement for require-directory module if you just want to initialize route/filter specific routes. Works with top level await.
export default async function (path: string, options: ImportDirOptions) {
  const fileNames = walk(path);

  let promises: Promise<any>[] = [];

  fileNames.forEach((file) => {
    if (file.endsWith(".js")) {
      if ((options.include && options.include.test(file)) || !options.include) {
        const module = import(file);
        promises.push(module);
      }
    }
  });

  const modules = await Promise.all(promises);

  for (const m of modules) {
    if (options && typeof options.visit === "function")
      await options.visit(m.default);
  }
}
