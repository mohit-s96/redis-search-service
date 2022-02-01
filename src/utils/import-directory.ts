import fs from "fs";

function walk(dir: string) {
  let results = [];

  let list = fs.readdirSync(dir);

  list.forEach(function (file) {
    file = dir + "/" + file;
    let stat = fs.statSync(file);

    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(walk(file));
    } else {
      /* Is a file */
      results.push(file);
    }
  });
  return results;
}

export default function (path: string, options: Record<string, any>) {
  const fileNames = walk(path);

  let promises: Promise<any>[] = [];

  fileNames.forEach((file) => {
    if (file.endsWith(".js")) {
      if (options.include && options.include.test(file)) {
        const module = import(file);
        promises.push(module);
      } else if (!options.include) {
        const module = import(file);
        promises.push(module);
      }
    }
  });
  return new Promise<void>((res) => {
    Promise.all(promises).then((modules) => {
      modules.forEach((m) => {
        if (options && typeof options.visit === "function")
          options.visit(m.default);
      });
      res();
    });
  });
}
