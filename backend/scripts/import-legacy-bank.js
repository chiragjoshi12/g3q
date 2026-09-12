/**
 * Legacy bank import previously copied into bank_questions.
 * That table was dropped — reimplement against question_roots + question_variants
 * before using `npm run import:legacy-bank` again.
 */
async function main() {
  throw new Error(
    'import:legacy-bank targets dropped bank_questions. Re-point this script at question_roots/question_variants first.'
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
