export function parseFRCL(script) {
  const lines = script.split("\n");

  let model = null;
  let input = null;

  for (const line of lines) {
    if (line.includes("use model")) {
      model = line.split(" ")[2];
    }

    if (line.includes("input")) {
      input = line.match(/"(.+?)"/)?.[1];
    }
  }

  return { model, input };
}
