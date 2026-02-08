type computeMSTuples = [count: number, unit: "secs" | "mins" | "hrs" | "days"];

const sec = (i: number) => i * 1000;
const min = (i: number) => i * sec(60);
const hr = (i: number) => i * min(60);
const days = (i: number) => i * hr(24);

export const computeMS = (...inputs: computeMSTuples[]) => {
  let out = 0;
  for (const i of inputs) {
    switch (i[1]) {
      case "secs":
        out += sec(i[0]);
        break;
      case "mins":
        out += min(i[0]);
        break;
      case "hrs":
        out += hr(i[0]);
        break;
      case "days":
        out += days(i[0]);
        break;
    }
  }
  return out;
};
