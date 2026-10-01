import { availableParallelism } from "node:os";

export function validationJobs(args, maximum = 8) {
  const index = args.indexOf("--jobs");
  if (index === -1) return Math.min(maximum, availableParallelism());
  const value = args[index + 1];
  if (!/^[1-9]\d*$/.test(value ?? "") || Number(value) > 16) {
    throw new Error("Use --jobs with an integer from 1 to 16.");
  }
  return Number(value);
}

export async function runBounded(items, jobs, run) {
  if (!Number.isInteger(jobs) || jobs < 1) throw new Error("Worker count must be a positive integer.");
  const results = new Array(items.length);
  const errors = [];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(jobs, items.length) }, async () => {
    while (next < items.length && errors.length === 0) {
      const index = next++;
      try {
        results[index] = await run(items[index], index);
      } catch (error) {
        errors.push(error);
      }
    }
  }));
  if (errors.length) throw new AggregateError(errors, errors.map((error) => error.message).join("\n"));
  return results;
}
