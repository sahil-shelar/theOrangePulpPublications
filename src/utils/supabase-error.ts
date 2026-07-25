export function handleSupabaseError(error: any) {
  console.error("Supabase Error Code:", error?.code);
  console.error("Supabase Error Message:", error?.message);
  console.error("Supabase Error Details:", error?.details);
  console.error("Supabase Error Hint:", error?.hint);
  console.error("Full Error:", JSON.stringify(error, null, 2));

  throw new Error(`${error?.code || 'UNKNOWN'}: ${error?.message || 'An unknown Supabase error occurred'}`);
}
